import pandas as pd
from werkzeug.security import generate_password_hash, check_password_hash

class User:
    def __init__(self, username, password, role):
        self.username = username
        self.password_hash = generate_password_hash(password)
        self.role = role

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class UserStore:
    def __init__(self, csv_file):
        self.csv_file = csv_file
        self.users = self._load_users()

    def _load_users(self):
        try:
            df = pd.read_csv(self.csv_file)
            return {row['username']: User(row['username'], row['password'], row['role']) for _, row in df.iterrows()}
        except FileNotFoundError:
            return {}

    def get_user(self, username):
        return self.users.get(username)

    def add_user(self, username, password, role):
        if username not in self.users:
            self.users[username] = User(username, password, role)
            self._save_users()
            return True
        return False

    def _save_users(self):
        df = pd.DataFrame([
            {'username': username, 'password': user.password_hash, 'role': user.role}
            for username, user in self.users.items()
        ])
        df.to_csv(self.csv_file, index=False)