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
const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/generate", (req, res, next) => {
  upload.single("photo")(req, res, async function (err) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Upload Error</title>
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
          padding: 1rem;
          box-sizing: border-box;
        }
        .container {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(60, 72, 100, 0.15);
          padding: 2rem 2.5rem;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        h2 {
          color: #d9534f;
          font-size: 1.6rem;
          margin-bottom: 0.6rem;
        }
        p {
          color: #444;
          font-size: 1.05rem;
          margin-bottom: 1.5rem;
        }
        a {
          display: inline-block;
          background: linear-gradient(90deg, #6c63ff, #48b1f3);
          color: #fff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s, background 0.2s;
        }
        a:hover {
          background: linear-gradient(90deg, #48b1f3, #6c63ff);
          transform: translateY(-2px) scale(1.03);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🚫 File Too Large!</h2>
        <p>Please upload an image smaller than <strong>30MB</strong>.</p>
        <a href="/">⬅ Go Back</a>
      </div>
    </body>
    </html>
  `);
    } else if (err) {
      return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Upload Error</title>
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
          padding: 1rem;
          box-sizing: border-box;
        }
        .container {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(60, 72, 100, 0.15);
          padding: 2rem 2.5rem;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        h2 {
          color: #d9534f;
          font-size: 1.6rem;
          margin-bottom: 0.6rem;
        }
        p {
          color: #444;
          font-size: 1.05rem;
          margin-bottom: 1.5rem;
        }
        a {
          display: inline-block;
          background: linear-gradient(90deg, #6c63ff, #48b1f3);
          color: #fff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s, background 0.2s;
        }
        a:hover {
          background: linear-gradient(90deg, #48b1f3, #6c63ff);
          transform: translateY(-2px) scale(1.03);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>❌ Upload Error</h2>
        <p>${err.message}</p>
        <a href="/">⬅ Go Back</a>
      </div>
    </body>
    </html>
  `);
    }
    const { name, class: className, position } = req.body;
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
      .rotate()
      .resize(PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT)
      .composite([
        {
          input: Buffer.from(svgMask),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();

    const CERT_WIDTH = 1050;
    const NAME_FONT_SIZE = 45;
    const CLASS_FONT_SIZE = 32;
    const POSITION_FONT_SIZE = 38;

    const textSvg = `
    <svg width="${CERT_WIDTH}" height="160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFD700"/>
          <stop offset="50%" stop-color="#FFA500"/>
          <stop offset="100%" stop-color="#FF8C00"/>
        </linearGradient>
      </defs>
      <style>
        .name {
          fill: #ffffff;
          text-align:center;
          font-size: ${NAME_FONT_SIZE}px;
          font-weight: bold;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .class {
          fill: #ffffff;
          font-size: ${CLASS_FONT_SIZE}px;
          font-weight: 600;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .position {
          fill: url(#goldGradient);
          text-align:center;
          font-size: ${POSITION_FONT_SIZE}px;
          font-weight: 700;
          font-family: 'Segoe UI', Arial, sans-serif;
          letter-spacing: 2px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
      </style>
      <text x="50%" y="32.5" text-anchor="middle" class="name">${name} (${className})</text>
      <text x="50%" y="81.5" text-anchor="middle" class="position">${position.toUpperCase()}</text>
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
  <title>Image Generated!</title>
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
      padding: 1rem;
      box-sizing: border-box;
    }

    .container {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 28px rgba(60, 72, 100, 0.15);
      padding: 2rem 2.2rem 1.7rem;
      text-align: center;
      box-sizing: border-box;
      width: 100%;
      max-width: 650px; /* ⬅️ Wider on desktop */
    }

    h2 {
      color: #2d3a6e;
      margin-bottom: 1rem;
      font-size: 1.7rem;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1.5px solid #e0e7ff;
      margin-bottom: 1rem;
      box-shadow: 0 2px 10px rgba(76, 110, 245, 0.08);
    }

    button {
      margin: 0.8rem 0 1.2rem;
      padding: 12px 28px;
      font-size: 1.05rem;
      font-weight: 600;
      background: linear-gradient(90deg, #6c63ff 0%, #48b1f3 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(76, 110, 245, 0.1);
      transition: background 0.2s, transform 0.1s;
    }

    button:hover {
      background: linear-gradient(90deg, #48b1f3 0%, #6c63ff 100%);
      transform: translateY(-2px) scale(1.03);
    }

    p {
      margin: 0.3rem 0;
      color: #3b4a7a;
      word-break: break-word;
      font-size: 1.05rem;
    }

    a {
      display: inline-block;
      color: #6c63ff;
      text-decoration: none;
      font-weight: 500;
      font-size: 1rem;
      margin-top: 0.5rem;
      transition: color 0.2s;
    }

    a:hover {
      color: #48b1f3;
    }

    /* Responsive Tweaks */
    @media (max-width: 600px) {
      .container {
        padding: 1.5rem 1.2rem;
        max-width: 95vw;
      }

      h2 {
        font-size: 1.4rem;
      }

      button {
        padding: 10px 24px;
        font-size: 1rem;
      }

      p {
        font-size: 0.95rem;
      }

      a {
        font-size: 0.95rem;
      }
    }

    @media (max-width: 360px) {
      .container {
        padding: 1.2rem 1rem;
      }

      h2 {
        font-size: 1.25rem;
      }

      button {
        font-size: 0.9rem;
        padding: 8px 20px;
      }

      p, a {
        font-size: 0.9rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Image Generated</h2>
    <img src="/uploads/${fileName}" alt="Image Preview" />
    <br/>
    <a href="/uploads/${fileName}" download="${name}.png">
      <button>⬇ Download Image</button>
    </a>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Class:</strong> ${className}</p>
    <p><strong>Position:</strong> ${position}</p>
    <a href="/">Generate Another</a>
  </div>
</body>
</html>
    `);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
