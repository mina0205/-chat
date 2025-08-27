# db 비밀번호 인코딩

import urllib.parse
     
     # 1. 이 곳에 실제 비밀번호를 입력하세요
password = "X39Q.ySYya.q4fF"
     
     # 2. 코드를 실행하면 인코딩된 비밀번호가 출력됩니다.
encoded_password = urllib.parse.quote_plus(password)
     
print("---")
print(f"원래 비밀번호: {password}")
print(f"URL-인코딩된 비밀번호: {encoded_password}")
print("---")
print("위의 'URL-인코딩된 비밀번호'를 복사하여 .env 파일에 사용하세요.")