// rc-verify-users.js - mark emails as verified for selected users
try {
  const database = db.getName && db.getName() ? db : db.getSiblingDB('rocketchat');
  const users = database.getCollection('users');
  function verify(username) {
    const u = users.findOne({ username }, { emails: 1 });
    if (!u) { print('user not found: ' + username); return; }
    if (u.emails && u.emails.length > 0) {
      users.updateOne({ _id: u._id }, { $set: { 'emails.0.verified': true } });
      print('verified: ' + username);
    } else {
      print('no emails for: ' + username);
    }
  }
  verify('admin');
  verify('aliflores');
  print('DONE');
} catch (e) {
  print('Error: ' + e.message);
}

