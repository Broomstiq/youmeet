# Project overview
You are building a dating platform based where users match according to an algorithm based on youtube subscriptions, they can then chat

You will be using nextJs 14, Chakra UI, Tailwind CSS, NextAuth.js, redis, Supabase Realtime, Supabase BullMQ and typescript

# Core functionlities
## I. User authentification 
When the user arrives on the landing page of the plaform he can :
1. User can sign up (NextAuth.js)
    1.1 Sign up using Google account
    1.2 Sign up manually with an email adress (with email verification) and password
    1.3 Once signed up the user should set up the account
        1.3.1 input basic information : name, age (by birth date), city (optional), profile picture (optional)
        1.3.2 link to youtube account for the initial data fetching of youtube subscription and and save link for later update of data
            User Authentication:
            Users authenticate using their Google accounts via OAuth2.
            The app requests access to their YouTube subscription data using the YouTube Data API.

            Fetch Subscription Data: use the YouTube Data API to fetch the user's subscription list.
            The data includes:
            Channel IDs.
            Channel names.
            Categories (optional via further API calls or manual mapping).

            Store in Database:
            Normalize and store user subscription data in a Supabase.
            Schema:
            users table: User metadata (user ID, name, email).
            subscriptions table: User subscriptions with fields user_id, channel_id, and category.
            Use tools like Prisma (ORM for Node.js) for easy database interaction.
        1.3.3 set the matching parameter : how many common subscription at least the user wants with his matches
2. User can log in (NextAuth.js)
    2.1 user can log in using google account
    2.2 user can log in using email and password

## II. User accounts settings
Once logged in, the user can access the account settings via a button and then a 'User settings' interface pops up. It displays the user's 'Name, Age' on top and allows the functionalities bellow :
1. User can update his youtube subpscription data by clicking on a button and related data is updated in supabase
2. User can reset his password via an email by clicking on a button. An email is then sent to his account's email with a reset password link leading back to the platform where he can input a new password (with password confirmation) and then validate by clicking on a button
3. User can modify the optional info of his account (city, profile picture) by clicking a pencil icon next to his profile name and age
4. User can modify the matching parameter : how many common subscription at least the user wants with his matches and then validate by clicking on a button



# III. The prematching algorithm
The prematching algorithm is ran in the backend (Node.JS) periodically (24h) using BullMQ
Users subscription data is retrieved from supabase and the algorithm is as follow :
"for 2 people to match, their data should be such as at least they have n common subscriptions with n being the maximum of the 2 users' matching parameters (how many common subscription at least the user wants with his matches)"
For one match, a relevancy attribute is associated : the bigger the number of common subscription is, the bigger the relevence is
The prematches for one user are stored as an ordered list : at log in we have at the top of the list the most relevant matches and at the botton the least relevent ones, then when the user "Skip"s matches they are put at the bottom of the list. The prematch on top of the list is to be shown next to the user : if it's skipped it's put back at the bottom, if it's matched it's removed from the prematch lists of both the users and a new match is added to the database
Cache computed matches using Redis for faster retrieval.

# IV. Swiping
Once logged in and the account is set, the user can navigate the other accounts the algorithm pre matched for the user.
One account appear on screen in a card, containing :
    - the profile picture in background (or default image)
    - name
    - age 
    - number of common subscriptions and names of 4 (at most) random channels among these
    - a "Show more" CTA to browse the full list of common subscriptions
On the right side of the card is a "Match" button that matches the two users (ie updates the database with the new match and removes the prematch from both the user's prematch lists in the database)
On the left side of the card is a "Skip" Button that pushes back the current user card at the bottom of the match list
In both buttons cases, the next match is then prompted on screen

# V. Chatting
Once a user has matches, he can chat with them. We'll use Supabase realtime to handle the chatting and keep the chatting basic (sending text messages)
We want a basic but complete chat interface :
- messages (displayed on the right for the user and on the left for his match)
- user input 
- send button
- at the top a bar, with the match name and when cliked redirected to the match's profile (same as the card in swiping mode)
- an option button to deleted match
- a return button to go back to homepage where the swiping happens

# Doc
Use the YouTube Data API v3 to fetch user subscriptions. Please refer to the @doc_code_youtube_data_retrieval folder for the code


## Database Schema :
### Users Table
| **Column**         | **Type**       | **Constraints**                            |
|---------------------|----------------|--------------------------------------------|
| `id`               | UUID          | Primary Key, Auto-generated                |
| `email`            | VARCHAR       | Unique, Not Null                           |
| `password_hash`    | TEXT          | Nullable                                   |
| `google_id`        | VARCHAR       | Nullable                                   |
| `name`             | VARCHAR       | Not Null                                   |
| `birth_date`       | DATE          | Not Null                                   |
| `city`             | VARCHAR       | Nullable                                   |
| `profile_picture`  | TEXT          | Nullable                                   |
| `matching_param`   | INTEGER       | Default: 3, Not Null                       |
| `created_at`       | TIMESTAMP     | Default: `NOW()`                           |

### Subscriptions Table
| **Column**         | **Type**       | **Constraints**                            |
|---------------------|----------------|--------------------------------------------|
| `id`               | UUID          | Primary Key, Auto-generated                |
| `user_id`          | UUID          | Foreign Key → `users.id`, Not Null         |
| `channel_id`       | VARCHAR       | Not Null                                   |
| `channel_name`     | VARCHAR       | Not Null                                   |
| `category`         | VARCHAR       | Nullable                                   |
| `created_at`       | TIMESTAMP     | Default: `NOW()`                           |

### Matches Table
| **Column**         | **Type**       | **Constraints**                            |
|---------------------|----------------|--------------------------------------------|
| `id`               | UUID          | Primary Key, Auto-generated                |
| `user_1_id`        | UUID          | Foreign Key → `users.id`, Not Null         |
| `user_2_id`        | UUID          | Foreign Key → `users.id`, Not Null         |
| `relevancy_score`  | INTEGER       | Not Null                                   |
| `created_at`       | TIMESTAMP     | Default: `NOW()`                           |

### Prematches Table
| **Column**         | **Type**       | **Constraints**                            |
|---------------------|----------------|--------------------------------------------|
| `id`               | UUID          | Primary Key, Auto-generated                |
| `user_id`          | UUID          | Foreign Key → `users.id`, Not Null         |
| `match_user_id`    | UUID          | Foreign Key → `users.id`, Not Null         |
| `relevancy_score`  | INTEGER       | Not Null                                   |
| `created_at`       | TIMESTAMP     | Default: `NOW()`                           |
| `skipped`          | BOOLEAN       | Default: `FALSE`                           |

### Chats Table
| **Column**         | **Type**       | **Constraints**                            |
|---------------------|----------------|--------------------------------------------|
| `id`               | UUID          | Primary Key, Auto-generated                |
| `match_id`         | UUID          | Foreign Key → `matches.id`, Not Null       |
| `sender_id`        | UUID          | Foreign Key → `users.id`, Not Null         |
| `message`          | TEXT          | Not Null                                   |
| `created_at`       | TIMESTAMP     | Default: `NOW()`                           |


# Current file structure
XXX