# Pages and endpoints

## Pages

* `/auth` sign in and create an account
* `/` home page
* `/exam` exam (placeholder)
* `/history` past exams (placeholder)
* `/profile` account data, pending email change, sign-in methods (link and unlink Google and GitHub), exam statistics,
  settings link and sign out
* `/settings` preferences (placeholder)
* `/auth/github/callback` finishes signing in with GitHub
* `/auth/github/callback/link` hands GitHub's code to the profile to link the account (signed in)
* `/auth/verify` verify email
* `/auth/verify/sent` verification link sent after registration
* `/auth/password/forgot` request a password reset link
* `/auth/password/reset` set a new password
* any other path: 404 page, with a link home (or to sign in when signed out)

## Used endpoints

See the server's [API](https://github.com/Laska254/prawko-server/blob/main/docs/api.md) for details.

* `/auth`
    + `POST` sign in
    + `POST /google` sign in with a Google ID token
    + `POST /github` sign in with a GitHub authorization code
    + `POST /refresh` get a new token pair
    + `POST /logout` sign out (revoke the refresh token)
    + `POST /verify` verify email
    + `POST /verify/resend` resend verification link
    + `POST /password/forgot` request a password reset link
    + `POST /password/reset` set a new password
* `/users`
    + `POST` register new user
    + `GET /me` get the signed-in user
    + `GET /me/stats` get the signed-in user's exam statistics
    + `POST /me/identities/google`, `POST /me/identities/github` link a provider account
    + `DELETE /me/identities/{provider}` unlink a provider account
    + `PATCH /{id}` update a user
    + `PATCH /me/password` change password
    + `DELETE /me` delete own account
    + `GET` list users (admin)
    + `GET /{id}` get a user (admin)
    + `DELETE /{id}` delete a user (admin)
* `/exams`
    + `POST` create an exam
    + `GET /{id}` get an exam
    + `GET` list a user's exams
    + `POST /{id}/answers` submit an answer
    + `POST /{id}/finish` finish an exam
* `/questions`
    + `GET /random` get a random question
    + `GET` list questions (admin)
    + `GET /{id}` get a question
    + `POST` upload questions from CSV (admin)
