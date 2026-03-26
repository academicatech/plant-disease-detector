
class PlantDatabase:
    def __init__(self):
        self.plants=[]
    def add(self,name,scientific,family):
        self.plants.append({"name":name,"scientific":scientific,"family":family})
    def search(self,name):
        for p in self.plants:
            if p["name"].lower()==name.lower():
                return p
        return None
