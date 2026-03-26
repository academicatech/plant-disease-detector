
import base64
class ImageTools:
    def encode(self,path):
        with open(path,"rb") as f:
            return base64.b64encode(f.read()).decode()
    def decode(self,data,out):
        with open(out,"wb") as f:
            f.write(base64.b64decode(data))
