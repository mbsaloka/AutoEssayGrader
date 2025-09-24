# Backend temp


## Mau make/testing

1. nyalain postgresql db (docker)
2. buat virtual env
3. install depend `pip install -r requirements.txt`
4. ganti `.env.example` jadi `.env` trus isi value nya
5. nyalain server `uvicorn main:app --reload`

## Buat tambahin services di folder /services

export langsung fungsi nya aja, nanti tinggal di pake di endpoint tergantung kebutuhan sama frontend nya

# Note

1. Kalo install dependency baru (dari service) tambahin di `requirements.txt`
2. kalo ada variabel secret (API key, dll) tambahin di `.env` sama `.env.example` (git ignore .env, BUKAN .env.example)
3. rekomennya pake virtual env
