# MySQL (Schema)

<img src="https://raw.githubusercontent.com/vimsd/pic_vim/20de1b5da23e2d935ecf5aa49e7c0155f656b59d/SQL_Schema.png" width="1600">


# MongoDB (Document structure)
```json
{
  "_id": {
    "$oid": "69ac64eb306a4b79009bf821"
  },
  "title": "Dune",
  "cast": [
    {
      "name": "Timothee Chalamet"
    }
  ],
  "content_rating": "PG-13",
  "duration_minutes": 155,
  "genres": [
    "Action",
    "Adventure",
    "Sci-Fi"
  ],
  "media": {
    "poster_url": "https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg"
  },
  "stats": {
    "average_rating": 5,
    "total_reviews": 1
  },
  "synopsis": "A mythic and emotionally charged hero's journey..."
}
```

การใช้งาน NoSQL (MongoDB) ในระบบโรงภาพยนตร์
ในโปรเจกต์นี้เราเลือกใช้สถาปัตยกรรมแบบ Polyglot Persistence (ใช้ DB สองประเภททำงานร่วมกัน) โดย MongoDB จะรับหน้าที่เก็บข้อมูลที่มีโครงสร้างไม่แน่นอน (Unstructured/Semi-structured Data) และมีการเปลี่ยนแปลงบ่อย

1. คอลเลกชัน Movies (ข้อมูลภาพยนตร์)
สิ่งที่เก็บ: ชื่อเรื่อง (Title), เรื่องย่อ (Synopsis), รายชื่อนักแสดง (Cast - เก็บเป็น List), หมวดหมู่หนัง (Genres - เก็บเป็น List), และข้อมูลสื่อต่างๆ (Media เช่น URL รูปภาพ Poster)
เหตุผลที่ใช้ MongoDB:
Flexibility: ข้อมูลหนังแต่ละเรื่องอาจมีรายละเอียดไม่เท่ากัน เช่น บางเรื่องมีรายชื่อนักแสดง 10 คน บางเรื่องมี 2 คน หรือบางเรื่องอาจจะมีลิงก์ตัวอย่างหนัง (Trailer) เพิ่มเข้ามาในอนาคต MongoDB ช่วยให้เราเพิ่ม Field เหล่านี้ได้โดยไม่ต้องแก้ Schema ของ Database ทั้งหมด
Performance: เราเก็บข้อมูลสถิติ (Stats) เช่น average_rating และ total_reviews ไว้ใน Document ของหนังเลย เพื่อให้หน้าแรกดึงข้อมูลไปแสดงผลได้ทันทีโดยไม่ต้องไป Join ตารางที่ซับซ้อน

---

2. คอลเลกชัน Theaters (ข้อมูลโรงภาพยนตร์)
สิ่งที่เก็บ: ชื่อโรง (Theater 1, Theater 2), รูปแบบของจอ (Format: IMAX, 4DX, Standard) และอุปกรณ์อำนวยความสะดวก (Facilities)
เหตุผลที่ใช้ MongoDB: ข้อมูลโรงหนังแต่ละประเภท (เช่น IMAX กับ Standard) อาจมีคุณสมบัติที่ต่างกันมาก การเก็บในรูปแบบ Document ช่วยให้เราขยายข้อมูลเฉพาะด้านของแต่ละประเภทจอได้ง่ายในอนาคต

---

3. คอลเลกชัน Reviews (การรีวิวและคะแนน)
สิ่งที่เก็บ: ID ของหนัง, ID ของผู้ใช้งาน, คะแนน (Rating), และข้อความรีวิว (Comment)
เหตุผลที่ใช้ MongoDB: การรีวิวถือเป็นข้อมูลประเภท Social Data ที่มีแนวโน้มจะขยายตัวสูงและอาจมีการเพิ่มฟีเจอร์ใหม่ๆ (เช่น การตอบกลับรีวิว หรือการใส่รูปภาพประกอบรีวิว) การใช้ MongoDB ทำให้ระบบรองรับการขยายตัว (Scalability) ได้ดีกว่า SQL ในส่วนของข้อมูลที่เป็นการโต้ตอบของผู้ใช้งาน

