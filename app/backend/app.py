from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)



# Define the key points of interest
key_points_list = [1, 4, 7, 12, 16, 19, 21]
last_point = 24




# Load data from CSV files
volunteers_df = pd.read_csv('volunteers.csv', encoding='utf-8')
fence_points_df = pd.read_csv('fence_points.csv', encoding='utf-8')
fence_points_df['importance'] = pd.to_numeric(fence_points_df['importance'], errors='coerce').fillna(10)



def find_nearest_key_point(point_id):
    if point_id == 24:
        return 1
    if point_id in key_points_list:
        return point_id
    before = [kp for kp in key_points_list if kp < point_id]
    after = [kp for kp in key_points_list if kp > point_id]
    if before and after:
        return before[-1] if (point_id - before[-1]) <= (after[0] - point_id) else after[0]
    return before[-1] if before else after[0]



def redistribute_volunteers(volunteers_df, key_points):
    assignments = []
    assigned_volunteers = set()

    # Step 1: Determine how many key points can be staffed
    num_volunteers = len(volunteers_df)
    max_key_points = num_volunteers // 2  # Each key point should have at least 2 volunteers
    sorted_key_points = key_points.sort_values(by='importance')

    # Step 2: Determine how many volunteers each key point will receive
    if max_key_points < len(sorted_key_points):
        # Only staff the top X most important key points
        prioritized_key_points = sorted_key_points.head(max_key_points)
    else:
        # Staff all key points
        prioritized_key_points = sorted_key_points

    # Determine the base number of volunteers per key point
    base_volunteers_per_point = 2
    extra_volunteers = num_volunteers - (base_volunteers_per_point * len(prioritized_key_points))
    
    # Calculate the volunteers needed for each key point
    volunteers_needed = {point_id: base_volunteers_per_point for point_id in prioritized_key_points['point_id']}
    
    # Distribute extra volunteers by importance
    for point_id in prioritized_key_points['point_id']:
        if extra_volunteers > 0:
            volunteers_needed[point_id] += 1
            extra_volunteers -= 1

    # Step 3: Assign volunteers to their nearest key points
    volunteer_assignments = {point_id: [] for point_id in prioritized_key_points['point_id']}
    available_volunteers = volunteers_df.to_dict(orient='records')

    # Sort volunteers by proximity to their closest key point
    for volunteer in available_volunteers:
        nearest_key_point = find_nearest_key_point(volunteer['closest_point'])
        if nearest_key_point in volunteer_assignments and len(volunteer_assignments[nearest_key_point]) < volunteers_needed[nearest_key_point]:
            volunteer_assignments[nearest_key_point].append(volunteer)
            assigned_volunteers.add(volunteer['id'])

    # Step 4: Handle extra volunteers
    for volunteer in available_volunteers:
        if volunteer['id'] not in assigned_volunteers:
            # Try to find the next nearest key point that needs more volunteers
            for point_id in prioritized_key_points['point_id']:
                if len(volunteer_assignments[point_id]) < volunteers_needed[point_id]:
                    volunteer_assignments[point_id].append(volunteer)
                    assigned_volunteers.add(volunteer['id'])
                    break

    # Convert assignment dictionary to a list of assignments
    assignments = [
        {
            'key_point': int(point_id),
            'importance': int(prioritized_key_points[prioritized_key_points['point_id'] == point_id]['importance'].values[0]),
            'volunteers': [v['name'] for v in volunteers]
        } for point_id, volunteers in volunteer_assignments.items() if volunteers
    ]

    return assignments, assigned_volunteers

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
def get_assignments():
    # Fully recalculate assignments on each request
    assignments = assign_volunteers()
    return jsonify(assignments)



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
        # Split volunteers into groups of 6 or less, evenly dividing large groups
        if len(volunteers) > 6:
            half = len(volunteers) // 2
            locations.append({
                'name': f"{location_name} Group 1",
                'volunteers': volunteers[:half]  # First half of volunteers
            })
            locations.append({
                'name': f"{location_name} Group 2",
                'volunteers': volunteers[half:]  # Second half of volunteers
            })
        else:
            locations.append({
                'name': location_name,
                'volunteers': volunteers
            })

    return jsonify(locations)




if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)