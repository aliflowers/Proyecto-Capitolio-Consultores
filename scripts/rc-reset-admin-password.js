// rc-reset-admin-password.js - run with: mongosh rocketchat /tmp/rc-reset.js
const hash = '$2b$10$h1YLNzKM.h2NXGYLIsjkGO.SgBKwRu.u1h3d3iyKOmmas8vELmJdW'; // bcrypt for NexusDev123!
const dbName = 'rocketchat';
try {
  const database = db.getName && db.getName() ? db : db.getSiblingDB(dbName);
  const users = database.getCollection('users');
  const u = users.findOne({ username: 'admin' });
  if (!u) {
    print('admin user not found');
    quit(2);
  }
  users.updateOne({ _id: u._id }, { $set: { 'services.password.bcrypt': hash }, $unset: { 'services.resume.loginTokens': '' } });
  const out = users.findOne({ _id: u._id }, { username: 1, roles: 1, 'services.password': 1 });
  printjson(out);
  print('Password reset to NexusDev123!');
} catch (e) {
  print('Error: ' + e.message);
  quit(1);
}

