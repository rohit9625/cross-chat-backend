# Cross Chat – Backend
_Server-driven real-time chat with reliable multilingual translations_

The **Cross Chat** backend powers real-time messaging and near real-time translations for the Cross Chat Android app.

This backend, along with the Android app, was built as part of a Hackathon hosted by [lingo.dev](https://lingo.dev) (31/01/2026 – 08/02/2026) 

_Please do check out the Android app repository here: https://github.com/rohit9625/cross-chat_

---

## ✨ Key Capabilities
It is designed around a database-backed, reliable translation pipeline that ensures:
- Messages are never blocked by translations
- Translations are eventually delivered even if users disconnect
- Socket events are best-effort, while the database remains the source of truth

#### Features
- **Real-time Messaging** using _socket.io_
- **Automatic Translations** based on user's preferred language
- **Reliable Translation Queue** using PostgreSQL (no Redis/Kafka required at this point)
- **Event-driven Workers** using LISTEN / NOTIFY
- JWT Authentication
- **Graceful Failure Handling** for translation pipeline with retries and status tracking
- Close to **Production-ready** architecture

>_Translations are handled asynchronously to keep chat delivery instant and reliable._

## 🧰 Tech Stack
- Node.js(Express) + TypeScript
- **Socket.IO** for real-time communication
- **PostgreSQL** for database
- **pg** (node-postgres) as database client
- [lingo.dev](https://lingo.dev/en/sdk) **JavaScript SDK** for message translations

### 🔄 Translation Pipeline

#### Detailed Flow
1. User A sends a message to User B
2. The message is saved to the database and emitted to User B over web-socket connection
3. A translation job is created for the message only if:
    - Both users have different locales/preferred_language set
4. NOTIFY translation_jobs wakes the worker
5. Worker claims jobs safely and update status in the database
6. Text is translated via **lingo.dev** Javascript SDK
7. Translation is saved in the database
8. A `message_translated` event is emitted to active users(having chat opened)
9. Offline users can receive translations on next fetch(opening the chat)

#### Translation Worker
- Runs inside the same Node.js process
- Uses a dedicated Postgres connection
- Listens for NOTIFY translation_jobs
- Falls back to polling every 5 seconds
- Shuts down gracefully on SIGINT / SIGTERM

This ensures:
- No lost translations
- No duplicate processing
- Clean shutdowns in production environments

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js 20.19.0+
- PostgreSQL 17+
- npm (node package manager)

### Running Server Locally
1. **Clone the repository**:
   ```bash
   git clone https://github.com/rohit9625/cross-chat-backend.git
   cd cross-chat-backend
   ```

2. **Install dependencies**:
    ```bash
   npm install
   ```

4. **Environment variables**:  
   Create a `.env` file at the root:
   ```bash
   PORT=8000
   DATABASE_URL=postgres://user:password@localhost:5432/crosschat
   JWT_SECRET=your_secret_key
   LINGODOTDEV_API_KEY=your_lingo_dev_api_key
   ```
   >Note: You must obtain an API key from [lingo.dev](https://lingo.dev/en/get-started)

5. **Run database migrations**:  
   _This project uses dbmate for managing PostgreSQL database schema and migrations._
   ```bash
   npx dbmate up
   ```
6. **Start the development server**:
   ```bash
   npm run dev
   ```

Alternatively, you can compile the Typescript code and run the server by:
- ```npm run build```
- ```npm run start```

## 🚧 Limitations & Future Improvements
- Doesn't support detecting the message source language
    - If a user has preferred_language set as `es(Spanish`
    - But, sends the message in `en(English)`
    - The translations will fail internally
    - And the receiver never gets the translated message in its preferred_language
- Push notifications for offline users
- Rate limiting and spam protection
- Scaling translation pipeline using _Kafka or Redis_
- Support for additional translation providers

## 🤝 Contributing
Contributions are always welcome, but please reach out before opening a PR :)

## 👨‍💻 Author
Built with a lot of persistence and caffeine by [Rohit Verma](https://github.com/rohit9625)  
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rohit0111/)
