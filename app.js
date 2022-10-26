const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running successfully");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//creating new user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE  
    username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbUser === undefined) {
    const createUserQuery = `
           INSERT INTO
              user (username,name, password,gender,location)
            VALUES
              (
                  '${username}',
                  '${name}',
                  '${hashedPassword}',
                  '${gender}',
                  '${location}'
              );
        `;

    await db.run(createUserQuery);
    response.status(200);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginUserQuery = `
        SELECT
            *
        FROM
            user 
        WHERE
            username = '${username}';
    `;
  const dbUser = await db.get(loginUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const changePasswordQuery = `
         SELECT
            *
         FROM 
           user
        WHERE
           username = '${username}';
    `;
  const dbUser = await db.get(changePasswordQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length > 4) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedQuery = `;
                      UPDATE user
                         SET
                          password = '${hashedPassword}'
                        WHERE
                          username = '${username}';
                 `;
        await db.run(updatedQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
