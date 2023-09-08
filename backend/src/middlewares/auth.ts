// I would be inclined to grant a session cookie when there is a login. For all other requests use the middleware to check if they have a
// valid cookie. On logout you can delete the cookie. You can also set a timeout on the cookie so that it expires after a certain amount of
// time
