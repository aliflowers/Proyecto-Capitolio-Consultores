// rc-auth-dev-patch.js - Enable common auth options for dev and iframe integration
try {
  const s = db.getSiblingDB('rocketchat').getCollection('rocketchat_settings');
  function up(id, val) { s.updateOne({ _id: id }, { $set: { value: val } }, { upsert: true }); }

  up('Accounts_AllowUsernameLogin', true);
  up('Accounts_AllowEmailLogin', true);
  up('Accounts_PasswordReset', true);
  up('Accounts_TwoFactorAuthentication_Enabled', false);
  up('API_Enable_Brute_Force_Protection', false);
  up('Iframe_Integration_receive_enable', true);
  up('Iframe_Integration_send_enable', true);

  print('OK');
} catch (e) {
  print('Error: ' + e.message);
}

