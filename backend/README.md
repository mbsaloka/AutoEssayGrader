# Backend template

## Mau make/testing

1. nyalain postgresql db (docker)

example :
```bash
# cek docker version (kalau belum install dulu)
docker --version
# init jalanin docker (sesuaikan di .env DATABASE_URL)
docker run --name your-postgres -e POSTGRES_PASSWORD=12345 -e POSTGRES_USER=youruser -e POSTGRES_DB=yournamedb -p 5432:5432 -d postgres
```

2. buat virtual venv install dependencies `pip install -r requirements.txt`

```bash
cd backend
# alternatif virtual env python
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
# deactivate untuk mematikan mode .venv
```
4. ganti `.env.example` jadi `.env` trus isi value nya

```bash
cp env.example .env
```
5. nyalain server `uvicorn main:app --reload`


## Buat tambahin services di folder /services

Export langsung fungsi nya aja, nanti tinggal di pake di endpoint tergantung kebutuhan sama frontend nya misal `http://127.0.0.1:8000/docs`


# Note
1. Kalo install dependency baru (dari service) tambahin di `requirements.txt`
2. kalo ada variabel secret (API key, dll) tambahin di `.env` sama `.env.example` (git ignore .env, BUKAN .env.example)
3. rekomennya pake virtual env python

`Untuk input bisa di /docs dengan cuma try out, response nya dalam json dibawahnya`