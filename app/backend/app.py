from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import timedelta, datetime, timezone
import requests
from functools import wraps
import pytz
import json
import warnings
import os
import pandas as pd
import traceback

from config import volunteers_table, fence_points_table
from boto3.dynamodb.conditions import Key, Attr

app = Flask(__name__)


#dev and prod:
cors_origins = os.environ.get('CORS_ORIGIN').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

#local:
#CORS(app, origins=["http://localhost:3000","http://localhost:3001"])

app.config['TIMEZONE'] = pytz.UTC

warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Define the key points of interest
key_points_list = [1, 4, 7, 12, 16, 19, 21]
last_point = 24
base_volunteers_per_point = 2
GROUP_SIZE = 3 

# Load data from CSV files
# volunteers_df = pd.read_csv('volunteers.csv', encoding='utf-8')
# fence_points_df = pd.read_csv('fence_points.csv', encoding='utf-8')
# fence_points_df['importance'] = pd.to_numeric(fence_points_df['importance'], errors='coerce').fillna(10)


def redistribute_volunteers(volunteers, key_points):
    assignments = []
    assigned_volunteers = set()

    # Step 1: Determine how many key points can be staffed

    num_volunteers = len(volunteers)
    max_key_points = num_volunteers // base_volunteers_per_point

    # Sort key points by importance
    sorted_key_points = sorted(key_points, key=lambda x: int(x['importance']))


    # Step 2: Determine which key points will be staffed
    if max_key_points < len(sorted_key_points):
        prioritized_key_points = sorted_key_points[:max_key_points]
    else:
        prioritized_key_points = sorted_key_points

    # Determine the base number of volunteers per key point
    extra_volunteers = num_volunteers - (base_volunteers_per_point * len(prioritized_key_points))

    # Calculate volunteers needed for each key point
    volunteers_needed = {int(point['point_id']): base_volunteers_per_point 
                        for point in prioritized_key_points}
    
    # Distribute extra volunteers by importance
    for point in prioritized_key_points:
        point_id = int(point['point_id'])
        if extra_volunteers > 0:
            volunteers_needed[point_id] += 1
            extra_volunteers -= 1

    # Step 3: Assign volunteers to key points
    volunteer_assignments = {int(point['point_id']): [] 
                           for point in prioritized_key_points}
    available_volunteers = volunteers.copy()

    # Function to find the nearest available volunteer to a key point
    def find_closest_volunteer(key_point, available_volunteers):
        closest_volunteer = None
        min_distance = float('inf')
        for volunteer in available_volunteers:
            if volunteer['id'] in assigned_volunteers:
                continue  # Skip already assigned volunteers
            distance = circular_distance(key_point, int(volunteer['closest_point']))
            if distance < min_distance:
                min_distance = distance
                closest_volunteer = volunteer
        return closest_volunteer

    # Loop through prioritized key points and assign the closest volunteers
    for point in prioritized_key_points:
        point_id = int(point['point_id'])
        while len(volunteer_assignments[point_id]) < volunteers_needed[point_id]:
            closest_volunteer = find_closest_volunteer(point_id, available_volunteers)
            if closest_volunteer:
                volunteer_assignments[point_id].append(closest_volunteer)
                assigned_volunteers.add(int(closest_volunteer['id']))
                available_volunteers.remove(closest_volunteer)
            else:
                break  # No more available volunteers

    # Convert assignment dictionary to a list of assignments
    assignments = [
        {
            'key_point': point_id,
            'importance': next(int(p['importance']) for p in prioritized_key_points 
                             if int(p['point_id']) == point_id),
            'volunteers': [v['name'] for v in volunteers]
        } 
        for point_id, volunteers in volunteer_assignments.items() 
        if volunteers
    ]

    return assignments

# Helper function for circular distance
def circular_distance(p1, p2):
    total_points = last_point
    forward = (p2 - p1) % total_points
    backward = (p1 - p2) % total_points
    return min(forward, backward)

def assign_volunteers():
    try:
        # Get available volunteers
        response = volunteers_table.scan(
            FilterExpression=Attr('available').eq(True)
        )
        available_volunteers = response['Items']

        # Get key points
        response = fence_points_table.scan(
            FilterExpression=Attr('point_id').is_in(key_points_list)
        )
        key_points = response['Items']

        # Create assignments
        assignments = redistribute_volunteers(available_volunteers, key_points)
        
        # Log for debugging
        print(f"Found {len(available_volunteers)} available volunteers")
        print(f"Found {len(key_points)} key points")
        print(f"Created {len(assignments)} assignments")
        
        return assignments
        
    except Exception as e:
        print(f"Error in assign_volunteers: {str(e)}")
        print("Available volunteers:", available_volunteers)
        print("Key points:", key_points)
        raise

@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    response = volunteers_table.scan()
    return jsonify(response['Items'])

@app.route('/api/update_status', methods=['POST'])
def update_status():
    data = request.json
    volunteer_id = int(data['id'])
    available = bool(data['available'])

    print(f"Received request to update volunteer {volunteer_id} availability to {available}")

    try:
        response = volunteers_table.update_item(
            Key={'id': volunteer_id},
            UpdateExpression='SET available = :val',
            ExpressionAttributeValues={':val': available},
            ReturnValues='UPDATED_NEW'
        )
        print("Volunteer status updated successfully.")
        return jsonify({'status': 'success', 'message': 'Volunteer status updated.'})
    except Exception as e:
        print(f"Error updating volunteer: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Volunteer not found.'}), 404

# עמדות
@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    assignments = assign_volunteers()
    return jsonify(assignments)

# שכונות
@app.route('/api/locations', methods=['GET'])
def get_locations():
    # Get available volunteers from DynamoDB
    response = volunteers_table.scan(
        FilterExpression=Attr('available').eq(True)
    )
    available_volunteers = response['Items']

    # Group volunteers by location
    location_groups = {}
    for volunteer in available_volunteers:
        location = volunteer['location']
        if location not in location_groups:
            location_groups[location] = []
        location_groups[location].append(volunteer['name'])

    locations = []
    for location_name, volunteers in location_groups.items():
        total_volunteers = len(volunteers)

        if total_volunteers == 0:
            continue

        # If total volunteers is less than GROUP_SIZE, keep them all in one group
        if total_volunteers < GROUP_SIZE:
            locations.append({
                'name': f"{location_name} Group 1",
                'volunteers': volunteers
            })
            continue

        # Calculate number of groups
        if total_volunteers >= 2 * GROUP_SIZE:
            num_groups = total_volunteers // GROUP_SIZE
        else:
            num_groups = 1
        
        # Calculate base size and extras
        base_size = total_volunteers // num_groups
        extras = total_volunteers % num_groups
        
        current_position = 0
        for group_idx in range(num_groups):
            # Calculate this group's size
            group_size = base_size + (1 if group_idx < extras else 0)
            
            group_volunteers = volunteers[current_position:current_position + group_size]
            locations.append({
                'name': f"{location_name} Group {group_idx + 1}",
                'volunteers': group_volunteers
            })
            current_position += group_size

    return jsonify(locations)

@app.route('/api/volunteers', methods=['POST'])
def add_volunteer():
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Prepare volunteer item
        volunteer_item = {
            'id': int(data['id']),
            'name': data['name'],
            'location': data['location'],
            'closest_point': int(data['closest_point']),
            'available': False  
        }

        # Add to DynamoDB
        volunteers_table.put_item(Item=volunteer_item)

        return jsonify({
            'status': 'success',
            'message': 'Volunteer added successfully',
            'volunteer': volunteer_item
        }), 201

    except Exception as e:
        print(f"Error adding volunteer: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/volunteers/<int:volunteer_id>', methods=['DELETE'])
def delete_volunteer(volunteer_id):
    try:
        # Delete from DynamoDB
        volunteers_table.delete_item(
            Key={'id': volunteer_id}
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Volunteer deleted successfully'
        }), 200

    except Exception as e:
        print(f"Error deleting volunteer: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    
    # Dev and Production settings (commented out during local testing)
    app.run(ssl_context=('/etc/letsencrypt/live/app.yisraelberman.com/fullchain.pem', '/etc/letsencrypt/live/app.yisraelberman.com/privkey.pem'))
    
   

    # Local development settings (remove before pushing to production)
    #app.run(host='127.0.0.1', port=5000, debug=True)
    
    
    app.config['TIMEZONE'] = pytz.UTC
