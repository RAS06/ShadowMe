// Create an admin user and a project database with a user
print('Initializing MongoDB users and database...');

db = db.getSiblingDB('admin');

try {
  db.createUser({
    user: 'admin',
    pwd: 'adminpass',
    roles: [{ role: 'root', db: 'admin' }]
  });
  print('Created admin user');
} catch (e) {
  print('Admin user may already exist:', e);
}

// Create application database and user
const appDb = db.getSiblingDB('shadowme');
try {
  appDb.createUser({
    user: 'shadowuser',
    pwd: 'shadowpass',
    roles: [{ role: 'readWrite', db: 'shadowme' }]
  });
  print('Created shadowme user');
} catch (e) {
  print('App user may already exist:', e);
}
