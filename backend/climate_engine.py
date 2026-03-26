
class ClimateEngine:
    def __init__(self):
        self.regions={}
    def add_region(self,name,temp):
        self.regions[name]=temp
    def check(self,region):
        if region not in self.regions:
            return "unknown"
        if self.regions[region]>20:
            return "good"
        return "moderate"
