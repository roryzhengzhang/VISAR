# VISAR

## Run VISAR system

### Front-end server
Please run front-end server by executing `npm start` under the folder **gpt-writing-frontend**, the server will default run on port 3000 in development mode.

Note: You may need to update the backend API URLs used in the current frontend server to the URL of the backend server that you run. A simple way is to search `visar.app/api` under the folder **gpt-writing-frontend** and replace all of the occurences to your back-end server URL (default should be localhost:8080).

### Back-end server
Go to folder **gpt-writing-backend**. Please run the back-end server by executing `python server.py`. Make sure to install the dependency listed in **gpt-writing-backend/requirement.txt** first. Please create an file **gpt-writing-backend/openai_key.json** and put your OpenAI key in the following JSON form:

```
{
    key: "Your OpenAI key"
}
```
Similarly, create a file called **gpt-writing-backend/mongoDB_key.json** and store your MongoDB key in the same form. You need to create a new mongoDB database called "gptwriting", and create collections called "users" and "interactionData" in the database.