// rc-dump-auth-settings.js - Dump subset of authentication-related settings
try {
  const s = db.getSiblingDB('rocketchat').getCollection('rocketchat_settings');
  const ids = [
    'Accounts_LoginExpiration',
    'Accounts_RegistrationForm',
    'Accounts_PasswordReset',
    'Accounts_TwoFactorAuthentication_Enabled',
    'Accounts_OAuth_Custom_Token_Enabled',
    'Accounts_Login_Expiration',
    'Accounts_UseDefaultBlockedDomainsList',
    'LDAP_Enable',
    'API_Enable_Rate_Limiter',
    'API_Enable_Brute_Force_Protection',
    'API_Enable_Rate_Limiter',
    'Accounts_Iframe_enabled',
    'Iframe_Integration_send_enable',
    'Iframe_Integration_receive_enable'
  ];
  const cur = s.find({ _id: { $in: ids } }, { _id:1, value:1 }).toArray();
  printjson(cur);
} catch (e) {
  print('Error: ' + e.message);
}

