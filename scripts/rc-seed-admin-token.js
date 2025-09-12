// rc-seed-admin-token.js
// Inserts a personal access token (PAT) for admin user with a precomputed hash
(function(){
  const token = '465add3ee1ca78a502ea465e2545cdf83b344d1879abfad1dbc3ed02514ce271';
  const hashed = 'k/zceP2SosvkR/WDvSJ2jcCtBrjDfIJquQWkPnM2MEo='; // sha256(base64) of token
  const u = db.users.findOne({ username: 'admin' }, { _id: 1 });
  if (!u) { print('admin not found'); quit(2); }
  db.users.updateOne(
    { _id: u._id },
    { $set: { 'services.resume.loginTokens': [
      { hashedToken: hashed, type: 'personalAccessToken', name: 'dev-pat', createdAt: new Date(), lastTokenPart: token.slice(-4) }
    ] } }
  );
  print('Seeded PAT for admin. Use this as X-Auth-Token:');
  print(token);
  print('UserId:');
  print(u._id.str || u._id);
})();

