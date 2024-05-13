import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as http from "http";
var content =
  "Ta là Thiên Đế chi tử, chưởng quản Thiên Lang Thư Uyển trăm vạn năm, Chư Thiên điển tịch, ta không chỗ nào không duyệt; Chư Thiên pháp môn, ta không gì không biết. Một thân đan đạo tu vi, càng là nổi tiếng Chư Thiên. Chỉ tiếc kiếp trước đầy bụng kinh luân, một bụng lý luận không thể thực tiễn. Hôm nay, được chuyển sinh Tạo Hóa, đã có tư chất tu luyện, Giang Trần ta càng có sợ gì? Có lý do gì cúi đầu nhận thua?. Trong kinh mạch, chân khí chậm rãi lưu động, tuy nhỏ yếu, nhỏ yếu đến cơ hồ muốn khô kiệt. Nhưng mà, đúng là một đạo chân khí yếu ớt này, lại như hỏa hoa nhen nhóm tánh mạng chi quang của hắn, đem những cảm xúc tiêu cực quét qua sạch sẽ. Tu luyện! Ha ha, tu luyện! Chẳng bao lâu sau, đối với ta trời sinh Thái Âm Chi Thể mà nói, là một khái niệm xa xỉ hạng gì? Kiếp trước, ta không thể tu luyện, lại chưa từng hướng vận mệnh khuất phục. Hôm nay, ta chuyển sinh đạt được tư chất tu luyện, chẳng lẽ không phải vận mệnh chi môn mở ra cho ta một khe hở sao?";
var gender = "male";

const bodyReq = { input: content, gender: gender };
const tempFilePath = path.join(os.tmpdir(), "test.wav");
var arr = [];
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 1,
});
var post_options = {
  host: "210.211.125.214",
  port: "5003",
  path: "/tts",
  method: "POST",
  timeout: 30000,
  agent: agent,
  headers: {
    "Content-Type": "application/json",
  },
};

// Set up the request
var reqz = http.request(post_options, function (res) {
  res
    .on("data", (chunk) => {
      console.log("chunk: " + chunk.length);
      arr.push(chunk);
    })
    .on("error", (err) => {
      console.log("err: " + err);
    })
    .on("end", () => {
      // fs.writeFileSync(tempFilePath, Buffer.concat(arr));
      console.log("end");
    })
    .on("close", () => {
      console.log(
        "close: " +
          Buffer.concat(arr).length +
          "/" +
          JSON.stringify(res.headers)
      );
    });
});
reqz.write(JSON.stringify(bodyReq));
reqz.end();
