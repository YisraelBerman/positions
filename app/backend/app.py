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

app = Flask(__name__)


#dev and prod:
#CORS(app, resources={r"/api/*": {"origins": os.environ.get('CORS_ORIGIN', 'https://app.yisraelberman.com')}})
#local:
CORS(app, origins=["http://localhost:3000"])

app.config['TIMEZONE'] = pytz.UTC

warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Define the key points of interest
key_points_list = [1, 4, 7, 12, 16, 19, 21]
last_point = 24
base_volunteers_per_point = 2
GROUP_SIZE = 3 

# Load data from CSV files
volunteers_df = pd.read_csv('volunteers.csv', encoding='utf-8')
fence_points_df = pd.read_csv('fence_points.csv', encoding='utf-8')
fence_points_df['importance'] = pd.to_numeric(fence_points_df['importance'], errors='coerce').fillna(10)


def redistribute_volunteers(volunteers_df, key_points):
    assignments = []
    assigned_volunteers = set()

    # Step 1: Determine how many key points can be staffed
    num_volunteers = len(volunteers_df)
    max_key_points = num_volunteers // 2  # Each key point should have at least 2 volunteers
    sorted_key_points = key_points.sort_values(by='importance')

    # Step 2: Determine which key points will be staffed
    if max_key_points < len(sorted_key_points):
        # Only staff the top X most important key points
        prioritized_key_points = sorted_key_points.head(max_key_points)
    else:
        # Staff all key points
        prioritized_key_points = sorted_key_points

    # Determine the base number of volunteers per key point
    extra_volunteers = num_volunteers - (base_volunteers_per_point * len(prioritized_key_points))

    # Calculate the volunteers needed for each key point
    volunteers_needed = {point_id: base_volunteers_per_point for point_id in prioritized_key_points['point_id']}
    
    # Distribute extra volunteers by importance
    for point_id in prioritized_key_points['point_id']:
        if extra_volunteers > 0:
            volunteers_needed[point_id] += 1
            extra_volunteers -= 1

    # Step 3: Assign volunteers to key points by looping through key points
    volunteer_assignments = {point_id: [] for point_id in prioritized_key_points['point_id']}
    available_volunteers = volunteers_df.to_dict(orient='records')

    # Function to find the nearest available volunteer to a key point
    def find_closest_volunteer(key_point, available_volunteers):
        closest_volunteer = None
        min_distance = float('inf')
        for volunteer in available_volunteers:
            if volunteer['id'] in assigned_volunteers:
                continue  # Skip already assigned volunteers
            distance = circular_distance(key_point, volunteer['closest_point'])
            if distance < min_distance:
                min_distance = distance
                closest_volunteer = volunteer
        return closest_volunteer

    # Loop through prioritized key points and assign the closest volunteers
    for point_id in prioritized_key_points['point_id']:
        while len(volunteer_assignments[point_id]) < volunteers_needed[point_id]:
            closest_volunteer = find_closest_volunteer(point_id, available_volunteers)
            if closest_volunteer:
                volunteer_assignments[point_id].append(closest_volunteer)
                assigned_volunteers.add(closest_volunteer['id'])
                available_volunteers.remove(closest_volunteer)
            else:
                break  # No more available volunteers

    # Convert assignment dictionary to a list of assignments
    assignments = [
        {
            'key_point': int(point_id),
            'importance': int(prioritized_key_points[prioritized_key_points['point_id'] == point_id]['importance'].values[0]),
            'volunteers': [v['name'] for v in volunteers]
        } for point_id, volunteers in volunteer_assignments.items() if volunteers
    ]

    return assignments, assigned_volunteers

# Helper function for circular distance
def circular_distance(p1, p2):
    total_points = last_point
    forward = (p2 - p1) % total_points
    backward = (p1 - p2) % total_points
    return min(forward, backward)

def assign_volunteers():
    # Step 1: Filter available volunteers
    available_volunteers = volunteers_df[volunteers_df['available'] == True]

    # Step 2: Get the sorted key points
    key_points = fence_points_df[fence_points_df['point_id'].isin(key_points_list)]

    # Step 3: Redistribute volunteers and create assignments
    assignments, assigned_volunteers = redistribute_volunteers(available_volunteers, key_points)

    # Step 4: Handle any remaining unassigned volunteers if any
    unassigned_volunteers = available_volunteers[~available_volunteers['id'].isin(assigned_volunteers)]
    if not unassigned_volunteers.empty:
        print("Warning: Some volunteers were not assigned.")
        print("Unassigned volunteers:", unassigned_volunteers.to_dict(orient='records'))

    return assignments

@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    return jsonify(volunteers_df.to_dict(orient='records'))

@app.route('/api/update_status', methods=['POST'])
def update_status():
    global volunteers_df

    data = request.json
    volunteer_id = data['id']
    available = data['available']

    print(f"Received request to update volunteer {volunteer_id} availability to {available}")

    if volunteer_id in volunteers_df['id'].values:
        volunteers_df.loc[volunteers_df['id'] == volunteer_id, 'available'] = available
        volunteers_df.to_csv('volunteers.csv', index=False)
        volunteers_df = pd.read_csv('volunteers.csv')
        print("Volunteer status updated successfully.")
        return jsonify({'status': 'success', 'message': 'Volunteer status updated.'})
    else:
        print("Volunteer not found.")
        return jsonify({'status': 'error', 'message': 'Volunteer not found.'}), 404

# עמדות
@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    assignments = assign_volunteers()
    return jsonify(assignments)

# שכונות
@app.route('/api/locations', methods=['GET'])
def get_locations():
    # Filter volunteers to include only those who are available
    available_volunteers_df = volunteers_df[volunteers_df['available'] == True]

    # Group available volunteers by location
    grouped = available_volunteers_df.groupby('location')['name'].apply(list).reset_index()
    locations = []

    for _, row in grouped.iterrows():
        location_name = row['location']
        volunteers = row['name']
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

        # Calculate number of groups based on total volunteers
        # If volunteers >= 2 * GROUP_SIZE, split into multiple groups
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



if __name__ == '__main__':
    
     # dev and Production settings (commented out during local testing)
    #app.run(ssl_context=('/etc/letsencrypt/live/app.yisraelberman.com/fullchain.pem', '/etc/letsencrypt/live/app.yisraelberman.com/privkey.pem'))
    
    # Local development settings (remove before pushing to production)
    app.run(host='127.0.0.1', port=5000, debug=True)
    
    
    app.config['TIMEZONE'] = pytz.UTC
