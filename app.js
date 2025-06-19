const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.render("index"); 
});

app.post("/generate", upload.single("photo"), async (req, res) => {
  const { name, class: className } = req.body;
  const photoBuffer = req.file.buffer;

  const templatePath = path.join(__dirname, "public", "template.png");
  const fileName = `output-${Date.now()}.png`;
  const outputPath = path.join("public", "uploads", fileName);

  const PLACEHOLDER_WIDTH = Math.round(393 * 0.95);
  const PLACEHOLDER_HEIGHT = Math.round(492 * 0.95);
  const PLACEHOLDER_LEFT = 345 + Math.round((393 - PLACEHOLDER_WIDTH) / 2);
  const PLACEHOLDER_TOP = 309 + Math.round((492 - PLACEHOLDER_HEIGHT) / 2);
  const CORNER_RADIUS = 40;

  const svgMask = `
  <svg width="${PLACEHOLDER_WIDTH}" height="${PLACEHOLDER_HEIGHT}">
    <path
      d="
        M ${CORNER_RADIUS} 0
        H ${PLACEHOLDER_WIDTH - CORNER_RADIUS}
        Q ${PLACEHOLDER_WIDTH} 0 ${PLACEHOLDER_WIDTH} ${CORNER_RADIUS}
        V ${PLACEHOLDER_HEIGHT}
        H ${CORNER_RADIUS}
        Q 0 ${PLACEHOLDER_HEIGHT} 0 ${PLACEHOLDER_HEIGHT - CORNER_RADIUS}
        V ${CORNER_RADIUS}
        Q 0 0 ${CORNER_RADIUS} 0
        Z
      "
      fill="white"
    />
  </svg>
  `;

  const roundedPhoto = await sharp(photoBuffer)
    .resize(PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT)
    .composite([
      {
        input: Buffer.from(svgMask),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const debugPhotoPath = `public/uploads/debug-rounded-${Date.now()}.png`;
  await sharp(roundedPhoto).toFile(debugPhotoPath);

  await sharp(templatePath)
    .composite([
      {
        input: roundedPhoto,
        top: PLACEHOLDER_TOP,
        left: PLACEHOLDER_LEFT,
      },
    ])
    .toFile(outputPath);

  res.send(`
    <div style="
      max-width: 420px;
      margin: 40px auto;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 8px 32px rgba(60, 72, 100, 0.18);
      padding: 2.2rem 2rem 1.5rem 2rem;
      text-align: center;
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    ">
      <h2 style="color: #2d3a6e; margin-bottom: 1.2rem; font-size: 1.5rem;">Generated</h2>
      <img src="/uploads/${fileName}" style="max-width: 320px; width: 100%; height: auto; border-radius: 12px; border: 1.5px solid #e0e7ff; margin-bottom: 1.1rem; box-shadow: 0 2px 12px rgba(76, 110, 245, 0.07);" alt="Certificate Preview" />
      <br/>
      <a href="/uploads/${fileName}" download="certificate.png">
        <button style="
          margin: 10px 0 18px 0;
          padding: 12px 28px;
          font-size: 1.08rem;
          font-weight: 600;
          background: linear-gradient(90deg, #6c63ff 0%, #48b1f3 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(76, 110, 245, 0.08);
          transition: background 0.2s, transform 0.1s;
        " onmouseover="this.style.background='linear-gradient(90deg, #48b1f3 0%, #6c63ff 100%)';this.style.transform='translateY(-2px) scale(1.03)';" onmouseout="this.style.background='linear-gradient(90deg, #6c63ff 0%, #48b1f3 100%)';this.style.transform='none';">
          ⬇ Download Certificate
        </button>
      </a>
      <div style="margin-bottom: 0.7rem;"></div>
      <p style="margin: 0.2rem 0; color: #3b4a7a;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 0.2rem 0 1.2rem 0; color: #3b4a7a;"><strong>Class:</strong> ${className}</p>
      <a href="/" style="
        display: inline-block;
        margin-top: 0.5rem;
        color: #6c63ff;
        text-decoration: none;
        font-weight: 500;
        font-size: 1rem;
        transition: color 0.2s;
      " onmouseover="this.style.color='#48b1f3'" onmouseout="this.style.color='#6c63ff'">Generate Another</a>
    </div>
  `);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
