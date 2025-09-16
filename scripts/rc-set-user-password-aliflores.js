// rc-set-user-password-aliflores.js - run with: mongosh rocketchat /tmp/rc-set-user-password-aliflores.js
// Sets bcrypt password for user 'aliflores' to 'NexusDev123!'
// Hash precomputed (bcrypt $2b$10):
const hash = '$2b$10$h1YLNzKM.h2NXGYLIsjkGO.SgBKwRu.u1h3d3iyKOmmas8vELmJdW';
const dbName = 'rocketchat';
try {
  const database = db.getName && db.getName() ? db : db.getSiblingDB(dbName);
  const users = database.getCollection('users');
  const u = users.findOne({ username: 'aliflores' });
  if (!u) {
    print('user aliflores not found');
    quit(2);
  }
  users.updateOne(
    { _id: u._id },
    {
      $set: {
        'services.password.bcrypt': hash,
        active: true,
        type: 'user',
      },
      $unset: {
        'services.resume.loginTokens': ''
      }
    }
  );
  const out = users.findOne({ _id: u._id }, { username: 1, roles: 1, 'services.password': 1, active: 1 });
  printjson(out);
  print('Password for aliflores reset to NexusDev123!');
} catch (e) {
  print('Error: ' + e.message);
  quit(1);
}

