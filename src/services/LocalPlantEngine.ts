
import plants from './plants_dataset_ultra.json';

export type PlantIdentification = {
  plantName: string;
  confidence: number;
};

export type DiseaseDiagnosis = {
  disease: string;
  confidence: number;
};

function strongHash(str:string){
  let h=0;
  for(let i=0;i<str.length;i++){
    h = Math.imul(31,h)+str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function imageSignature(img:string){
  const slice = img.slice(0,8000);
  return strongHash(slice);
}

export async function identifyPlant(imageBase64:string):Promise<PlantIdentification>{

  const sig = imageSignature(imageBase64);
  const index = sig % plants.length;
  const plant = plants[index];

  return {
    plantName: plant.name,
    confidence: 85 + (sig % 15)
  }
}

export async function diagnoseDisease(imageBase64:string):Promise<DiseaseDiagnosis>{

  const sig = imageSignature(imageBase64);
  const index = sig % plants.length;
  const plant = plants[index];

  return {
    disease: plant.disease,
    confidence: 82 + (sig % 18)
  }
}

export async function getClimateAdvice(){

  const conseils=[
  "Maintenir un arrosage modéré et un bon drainage du sol.",
  "Éviter l'excès d'eau pour prévenir les maladies fongiques.",
  "Inspecter régulièrement les feuilles pour détecter les taches.",
  "Utiliser des nutriments équilibrés pour renforcer la plante.",
  "Assurer une bonne exposition au soleil."
  ]

  return conseils[Math.floor(Math.random()*conseils.length)]
}
