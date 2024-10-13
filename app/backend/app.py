from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, verify_jwt_in_request, decode_token
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
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Keycloak configuration
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', "https://3.86.189.1:8443")
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', "my-app-realm")
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_CLIENT_ID', "your-client-id")

# JWT configuration
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_ALGORITHM'] = 'RS256'
app.config['JWT_LEEWAY'] = timedelta(hours=12)
app.config['JWT_CLOCK_SKEW'] = timedelta(hours=12)
app.config['TIMEZONE'] = pytz.UTC

warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Fetch and set the public key from Keycloak
def get_keycloak_public_key():
    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
    try:
        response = requests.get(url, verify=False)  # Note: Use verify=True in production
        response.raise_for_status()
        return response.json()['public_key']
    except requests.RequestException as e:
        print(f"Error fetching Keycloak public key: {str(e)}")
        return None

public_key = get_keycloak_public_key()
if public_key:
    app.config['JWT_PUBLIC_KEY'] = f"-----BEGIN PUBLIC KEY-----\n{public_key}\n-----END PUBLIC KEY-----"
else:
    raise RuntimeError("Failed to fetch Keycloak public key")

jwt = JWTManager(app)

def custom_jwt_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            print(f"Received request for {request.path}")
            print("Request headers:")
            for header, value in request.headers:
                print(f"  {header}: {value}")
            
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                print("No Authorization header found in the request")
                return jsonify({"msg": "Missing Authorization Header"}), 401

            print(f"Authorization header: {auth_header}")

            try:
                token = auth_header.split()[1]
                decoded_token = decode_token(token)
                
                # Custom time check
                current_time = datetime.now(timezone.utc)
                token_iat = datetime.fromtimestamp(decoded_token['iat'], tz=timezone.utc)
                token_exp = datetime.fromtimestamp(decoded_token['exp'], tz=timezone.utc)
                
                print(f"Token 'iat': {token_iat}")
                print(f"Token 'exp': {token_exp}")
                print(f"Current server time: {current_time}")
                print(f"Time difference (iat): {current_time - token_iat}")

                if current_time < token_iat - timedelta(seconds=60):
                    raise ValueError("Token is not yet valid")
                if current_time > token_exp:
                    raise ValueError("Token has expired")

                print("JWT verified successfully")
                print(f"Decoded token: {json.dumps(decoded_token, indent=2)}")
            except Exception as e:
                print(f"JWT validation failed: {str(e)}")
                print(traceback.format_exc())
                return jsonify({"msg": f"JWT validation failed: {str(e)}"}), 401
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    print(f"Invalid token: {error_string}")
    return jsonify({
        'status': 401,
        'sub_status': 42,
        'msg': f'Invalid token: {error_string}'
    }), 401



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
@custom_jwt_required()
def get_volunteers():
    return jsonify(volunteers_df.to_dict(orient='records'))

@app.route('/api/update_status', methods=['POST'])
@custom_jwt_required()
def update_status():
    global volunteers_df  # Ensure volunteers_df is correctly used as global

    data = request.json
    volunteer_id = data['id']
    available = data['available']

    print(f"Received request to update volunteer {volunteer_id} availability to {available}")  # Debugging line

    # Check if the volunteer exists in the DataFrame
    if volunteer_id in volunteers_df['id'].values:
        # Update the availability status
        volunteers_df.loc[volunteers_df['id'] == volunteer_id, 'available'] = available
        
        # Save changes back to CSV
        volunteers_df.to_csv('volunteers.csv', index=False)

        # Reload the DataFrame if necessary to reflect updates immediately
        volunteers_df = pd.read_csv('volunteers.csv')

        print("Volunteer status updated successfully.")  # Debugging line
        return jsonify({'status': 'success', 'message': 'Volunteer status updated.'})
    else:
        print("Volunteer not found.")  # Debugging line
        return jsonify({'status': 'error', 'message': 'Volunteer not found.'}), 404

@app.route('/api/assignments', methods=['GET'])
@custom_jwt_required()
def get_assignments():
    # Fully recalculate assignments on each request
    assignments = assign_volunteers()
    return jsonify(assignments)



@app.route('/api/locations', methods=['GET'])
@custom_jwt_required()
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

        # Determine the maximum number of groups of size GROUP_SIZE
        num_groups = total_volunteers // GROUP_SIZE  # Full groups we can form
        remaining_volunteers = total_volunteers % GROUP_SIZE  # Volunteers left after forming full groups

        if num_groups > 0 and remaining_volunteers >= num_groups:
            # If remaining volunteers are enough to add one more volunteer to each group,
            # split them evenly across all groups.
            group_size = GROUP_SIZE + 1
            groups = [volunteers[i * group_size:(i + 1) * group_size] for i in range(num_groups)]
        elif num_groups > 0 and remaining_volunteers < num_groups:
            # Redistribute volunteers across the groups to avoid a smaller group
            # Increase the size of each group slightly to accommodate remaining volunteers
            extra = remaining_volunteers
            groups = []
            start = 0
            for i in range(num_groups):
                group_size = GROUP_SIZE + (1 if extra > 0 else 0)
                groups.append(volunteers[start:start + group_size])
                start += group_size
                if extra > 0:
                    extra -= 1
        else:
            # If we can't form full groups of the desired size, put all in one group 
            groups = [volunteers]

        # Add each group to the locations list with names
        for idx, group in enumerate(groups):
            locations.append({
                'name': f"{location_name} Group {idx + 1}",
                'volunteers': group
            })

    return jsonify(locations)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
    app.config['TIMEZONE'] = pytz.UTC

