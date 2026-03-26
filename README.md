# Chat-Node-js
Node.js ile resim tabanlı sohbetler gerçekleştirin. Ana bileşen socket.io'dur ve sohbetleriniz MongoDB kullanılarak kaydedilir.

Projemiz localhost'da 3000 portunda çalışacakır.
  Port için gerekli izinleri verelim:
sudo ufw allow 3000

a) Zor yol:
1- NVM'yi kurun:
BASH Ekranı=
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

2- Terminali Yenileyin:
BASH Ekranı=
source ~/.bashrc

3- Node.js'i Kurun (Örneğin en son LTS sürümü):
BASH Ekranı=
nvm install --lts

4- NodeSource PPA Kullanarak Kurulum (Güncel Sürüm İçin):
BASH Ekranı=
curl -fsSL https://nodesource.com | sudo -E bash -

5- Kurulumu Yapın:
BASH Ekranı=
sudo apt install -y nodejs

b) Kolay yol:

1- Paket Listesini Güncelleyin ve Kurun:
BASH Ekranı=
sudo apt update
sudo apt install nodejs npm

2- Kurulum doğrulama:
BASH Ekranı=
node -v
npm -v

Artık node js linux sistemine kurulu, şimdi projemizin kurulumunu yapalım.

Öncelikle sisteminize git yüklü değilse yükleyelim:
sudo apt update
sudo apt install git

Sonra aşağıdaki kodu projemizi kaydetmek istediğimiz klasöre gidip Bash ekranımıza girelim:
git clone https://github.com/ingilizozi/Chat-Node-js
Bunun ardından projemiz için gerekli kütüphaneleri yükleyelim:
npm install

Ve sertifikamızı ayarladıktan sonra projemizi çalıştıralım.
node index.js
