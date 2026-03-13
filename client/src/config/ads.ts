export interface AdItem {
  id: string;
  titleJa: string;
  titleEn: string;
  descJa: string;
  descEn: string;
  url: string;
  badge: string;
}

// 日本向け広告（A8.net / afb 経由）
// ※ url は ASP登録後に実際のアフィリエイトリンクに差し替え
export const JP_ADS: AdItem[] = [
  {
    id: "jp-aga-online",
    titleJa: "AGAオンラインクリニック",
    titleEn: "AGA Online Clinic",
    descJa: "薄毛が気になったら、まずはオンラインで無料相談。自宅から専門医に相談できます。",
    descEn: "Consult a hair loss specialist online for free.",
    url: "#placeholder-a8net-aga",
    badge: "PR",
  },
  {
    id: "jp-chapup",
    titleJa: "チャップアップ育毛剤",
    titleEn: "CHAPUP Hair Growth",
    descJa: "頭皮ケアを毎日の習慣に。医薬部外品の育毛剤で頭皮環境を整えましょう。",
    descEn: "Make scalp care a daily habit with a medicated hair growth product.",
    url: "#placeholder-a8net-chapup",
    badge: "PR",
  },
];

// 海外向け広告（Katalys 経由）
// ※ url は Katalys登録後に実際のアフィリエイトリンクに差し替え
export const GLOBAL_ADS: AdItem[] = [
  {
    id: "global-hims",
    titleJa: "Hims",
    titleEn: "Hims",
    descJa: "薄毛についてオンラインで医師に相談。あなたに合った治療プランをお届けします。",
    descEn: "Talk to a doctor about hair loss. Personalized treatment plans, delivered to your door.",
    url: "#placeholder-katalys-hims",
    badge: "Ad",
  },
  {
    id: "global-happy-head",
    titleJa: "Happy Head",
    titleEn: "Happy Head",
    descJa: "皮膚科医が処方するカスタム育毛トリートメント。効果を実感してください。",
    descEn: "Custom hair regrowth treatments prescribed by dermatologists. Start seeing results.",
    url: "#placeholder-katalys-happyhead",
    badge: "Ad",
  },
];
