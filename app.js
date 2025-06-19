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

  const templatePath = path.join(__dirname, "public", "template.png"); // Corrected template name
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

  const CERT_WIDTH = 768;
  const NAME_FONT_SIZE = 48;
  const CLASS_FONT_SIZE = 36;
 

  const textSvg = `
    <svg width="${CERT_WIDTH}" height="120">
      <style>
        .name { fill: #ffffff; font-size: ${NAME_FONT_SIZE}px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; }
        .class { fill: #ffffff; font-size: ${CLASS_FONT_SIZE}px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; }
      </style>
      <text x="70%" y="33" text-anchor="middle" class="name">${name}</text>
      <text x="70%" y="80" text-anchor="middle" class="class">${className}</text>
    </svg>
  `;

  await sharp(templatePath)
    .composite([
      {
        input: roundedPhoto,
        top: PLACEHOLDER_TOP,
        left: PLACEHOLDER_LEFT,
      },
      {
        input: Buffer.from(textSvg),
        top: 820,
        left: 0,
        blend: "over",
      },
    ])
    .toFile(outputPath);

  res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate Generated!</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%);
            min-height: 100vh;
            margin: 0;
            font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem; /* Added padding for very small screens */
            box-sizing: border-box;
          }
          .container {
            max-width: 420px;
            margin: 40px auto;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 8px 32px rgba(60, 72, 100, 0.18);
            padding: 2.2rem 2rem 1.5rem 2rem;
            text-align: center;
            box-sizing: border-box; /* Include padding in total width/height */
            width: 100%; /* Ensure it takes full width within max-width */
          }
          h2 {
            color: #2d3a6e;
            margin-bottom: 1.2rem;
            font-size: 1.5rem;
          }
          img {
            max-width: 320px;
            width: 100%;
            height: auto;
            border-radius: 12px;
            border: 1.5px solid #e0e7ff;
            margin-bottom: 1.1rem;
            box-shadow: 0 2px 12px rgba(76, 110, 245, 0.07);
          }
          button {
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
            width: auto; /* Allow button to size itself, or set to 100% if desired */
            max-width: 90%; /* Prevent button from being too wide on mobile */
          }
          button:hover {
            background: linear-gradient(90deg, #48b1f3 0%, #6c63ff 100%);
            transform: translateY(-2px) scale(1.03);
          }
          p {
            margin: 0.2rem 0;
            color: #3b4a7a;
            word-wrap: break-word; /* Prevent long names/classes from overflowing */
          }
          a {
            display: inline-block;
            margin-top: 0.5rem;
            color: #6c63ff;
            text-decoration: none;
            font-weight: 500;
            font-size: 1rem;
            transition: color 0.2s;
          }
          a:hover {
            color: #48b1f3;
          }
            
  
          /* Mobile-specific adjustments */
          @media (max-width: 500px) {
            .container {
              padding: 1.5rem 1rem; /* More balanced padding for smaller screens */
              margin: 20px auto; /* Adjust top/bottom margin */
              max-width: 95vw; /* Ensure it doesn't touch edges */
            }
            h2 {
              font-size: 1.3rem; /* Smaller heading on mobile */
              margin-bottom: 0.8rem;
            }
            img {
              margin-bottom: 0.8rem; /* Reduced margin below image */
            }
            button {
              padding: 10px 20px; /* Smaller padding for button */
              font-size: 0.95rem; /* Smaller font for button */
              max-width: 100%; /* Allow button to fill container if needed */
            }
            p {
              font-size: 0.9rem; /* Smaller text for name/class */
            }
            a {
              font-size: 0.9rem; /* Smaller "Generate Another" link */
            }
          }
  
          @media (max-width: 320px) {
            .container {
              padding: 1rem 0.8rem;
              margin: 10px auto;
            }
            h2 {
              font-size: 1.2rem;
            }
            button {
              padding: 8px 15px;
              font-size: 0.9rem;
            }
            p {
              font-size: 0.85rem;
            }
            a {
              font-size: 0.85rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Generated</h2>
          <img src="/uploads/${fileName}" alt="Certificate Preview" />
          <br/>
          <a href="/uploads/${fileName}" download="certificate.png">
            <button>
              ⬇ Download Image
            </button>
          </a>
          <div style="margin-bottom: 0.7rem;"></div>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Class:</strong> ${className}</p>
          <a href="/">Generate Another</a>
        </div>
      </body>
      </html>
    `);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
