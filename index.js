import express from "express";
import bodyParser from "body-parser";
import User from "./models/userSchema.js";
import { connect } from "./config/db.js";
import session from "express-session";
import lodash from "lodash";
import nodes7 from "nodes7";
import upload from "./config/upload.js";

// /////////////////////////++KẾT NỐI WEBSERVER VỚI PLC++/////////////////////////
// KHỞI TẠO KẾT NỐI PLC
var conn_plc1 = new nodes7();
var conn_plc2 = new nodes7();
conn_plc1.initiateConnection(
  { port: 102, host: "192.168.0.1", rack: 0, slot: 1 },
  PLC1_connected
);
conn_plc2.initiateConnection(
  { port: 102, host: "192.168.0.2", rack: 0, slot: 1 },
  PLC2_connected
);


// triger ghi dữ liệu vào SQL
var insert_trigger = false;			// Trigger
var old_insert_trigger = false;		// Trigger old
// triger ghi dữ liệu cảnh báo vào SQL
var Alarm_ID1 = false;			// Trigger Alarm add ID1
var Alarm_ID2 = false;			// Trigger Alarm add ID2
var Alarm_ID3 = false;			// Trigger Alarm add ID3
var Alarm_ID4 = false;			// Trigger Alarm add ID4
var Alarm_ID5 = false;			// Trigger Alarm add ID5

var Alarm_ID1_old = false;		// Trigger alarm old ID1
var Alarm_ID2_old = false;		// Trigger alarm old ID2
var Alarm_ID3_old = false;		// Trigger alarm old ID3
var Alarm_ID4_old = false;		// Trigger alarm old ID4
var Alarm_ID5_old = false;		// Trigger alarm old ID5
// Mảng xuất dữ liệu report Excel
var SQL_Excel = [];  // Dữ liệu nhập kho


// Bảng tag trong Visual studio code
var tags_list = {
  btt_Start: "DB37,X0.0",
  btt_Stop: "DB37,X0.1",
  btt_auto: "DB37,X0.2",
  btt_manual: "DB37,X0.3",
  btt_bom_on: "DB37,X0.4",
  btt_bom_off: "DB37,X0.5",
  btt_bangtai_on: "DB37,X0.6",
  btt_bangtai_off: "DB37,X0.7",
  btt_quaythuan_T1: "DB37,X1.0",
  btt_quaythuan_T2: "DB37,X1.1",
  btt_quaythuan_T3: "DB37,X1.2",
  btt_quaynghich_T1: "DB37,X1.3",
  btt_quaynghich_T2: "DB37,X1.4",
  btt_quaynghich_T3: "DB37,X1.5",
  CB_Position: "DB37,X1.6",
  CB_Position_Red: "DB37,X1.7",
  CB_Position_Blue: "DB37,X2.0",
  CB_Position_Yellow: "DB37,X2.1",
  CB_Position_Purple: "DB37,X2.2",
  Q_Lamp_Auto: "DB37,X2.3",
  Q_Lamp_Manu: "DB37,X2.4",
  sql_insert_Trigger: "DB37,X2.5",
  Alarm_M1: "DB37,X2.6",
  Alarm_M2: "DB37,X2.7",
  status_bangtai: "DB37,BYTE3",
  status_bom: "DB37,BYTE4",
  Act_Y_Products: "DB37,INT6",
  Act_P_Products: "DB37,INT8",
  Act_B_Products: "DB37,INT10",
  Act_Error_Products_R: "DB37,INT12",
};

// GỬI DỮ LIỆu TAG CHO PLC
// PLC1
function PLC1_connected(err) {
  if (typeof err !== "undefined") {
    console.log(err); // Hiển thị lỗi nếu không kết nối đƯỢc với PLC
  }
  conn_plc1.setTranslationCB(function (tag) {
    return tags_list[tag]; // Đưa giá trị đọc lên từ PLC và mảng
  });
  conn_plc1.addItems([
    "btt_Start",
    "btt_Stop",
    "btt_auto",
    "btt_manual",
    "btt_bom_on",
    "btt_bom_off",
    "btt_bangtai_on",
    "btt_bangtai_off",
    "btt_quaythuan_T1",
    "btt_quaythuan_T2",
    "btt_quaythuan_T3",
    "btt_quaynghich_T1",
    "btt_quaynghich_T2",
    "btt_quaynghich_T3",
    "CB_Position",
    "CB_Position_Red",
    "CB_Position_Blue",
    "CB_Position_Yellow",
    "CB_Position_Purple",
    "Q_Lamp_Auto",
    "Q_Lamp_Manu",
    "sql_insert_Trigger",
    "Alarm_M1",
    "Alarm_M2",
    "status_bangtai",
    "status_bom",
    "Act_Y_Products",
    "Act_P_Products",
    "Act_B_Products",
    "Act_Error_Products_R",
  ]);
}

// PLC2
function PLC2_connected(err) {
  if (typeof err !== "undefined") {
    console.log(err); // Hiển thị lỗi nếu không kết nối đƯỢc với PLC
  }
  conn_plc2.setTranslationCB(function (tag) {
    return tags_list[tag]; // Đưa giá trị đọc lên từ PLC và mảng
  });
  conn_plc2.addItems([
    
  ]);
}



////////////// CÁC KHỐI CHƯƠNG TRÌNH CON //////////////
var arr_tag_value = [];
function valuesReady(anythingBad, values) {
  if (anythingBad) {
    console.log("Lỗi khi đọc dữ liệu tag");
  }
  arr_tag_value = lodash.map(values, (item) => item);
  console.log(values);
}

// Hàm chức năng scan giá trị
function fn_read_data_scan() {
  conn_plc1.readAllItems(valuesReady);
  conn_plc2.readAllItems(valuesReady);
  fn_sql_insert();
  fn_Alarm_Manage();
}

// Time cập nhật mỗi 1s
// setInterval(() => fn_read_data_scan(), 1000);



////////////// THIẾT LẬP KẾT NỐI WEB //////////////
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// /////////////////////////++THIẾT LẬP KẾT NỐI WEB++/////////////////////////
import http from "http";
const server = http.createServer(app);

import { Server } from "socket.io";
const io = new Server(server);
const port = 3000
server.listen(port,()=>console.log(`[server]: Server is running at http://localhost:${port}`));
connect();

app.use((req, res, next) => {
  res.locals = {
    title: "Web Server || PLC",
    user: req.session.user,
  };
  next();
});

////////////// ĐĂNG NHẬP-ĐĂNG KÝ //////////////
app.get("/", (req, res, next) => {
  res.render("home", { message: "" });
});

app.get("/signup", (req, res, next) => {
  res.render("signup", { message: "" });
});

app.post("/signup", async (req, res, next) => {
  try {
    const { email, username, password, passwordConfirm } =
      req.body;
    const existedUser = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (existedUser) {
      return res.render("signup", {
        message: "Tài khoản đã tồn tại!",
      });
    }
    const newUser = new User({
      username: username,
      email: email,
      password: password,
    });
    await newUser.save();
    res.redirect("/login");
  } catch (error) {
    res.render("signup", {
      message: "Không thể đăng ký!",
    });
  }
});

app.get("/login", (req, res, next) => {
  res.render("login", { message: "" });
});

app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.render("login", {
        message: "Tài khoản này không tồn tại",
      });
    }

    if (user.password !== password) {
      return res.render("login", {
        message: "Sai mật khẩu vui lòng nhập lại",
      });
    } else {
      req.session.user = user;
      res.redirect("/");
    }
  } catch (error) {
    res.render("login", {
      message: "Đã xảy ra lỗi khi đăng nhập!",
    });
  }
});

app.post("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/login");
});

////////////// TRANG AUTO/MANUAL MODE //////////////
app.get("/automode", (req, res, next) => {
  // const user = req.session.user
  // console.log(req.session.user);

  // if(!user) {
  //   return res.redirect('/login')
  // }
  res.render("automode", { imgBuffer: app.locals.imgBuffer });
});

app.get("/manualmode", (req, res, next) => {
  // const user = req.session.user
  // console.log(req.session.user);

  // if(!user) {
  //   return res.redirect('/login')
  // }  
  res.render("manualmode", { imgBuffer: app.locals.imgBuffer });
});

////////////// TRANG GIOI THIEU //////////////
app.get('/gioithieu', (req, res, next) => {
  res.render('gioithieu', {imgBuffer: app.locals.imgBuffer})
});


////////////// TRUYỀN DỮ LIỆU TỪ CAM PYTHON //////////////
app.post('/uploads', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  
  const imgBuffer = req.file.buffer;
  app.locals.imgBuffer = imgBuffer;

  res.sendStatus(200);
});

app.get('/current-image', (req, res) => {
  if (app.locals.imgBuffer) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(app.locals.imgBuffer);
  } else {
      res.status(404).send('No image available.');
  }
});
