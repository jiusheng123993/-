export interface DailyQuote {
  content: string
  author: string
}

export const DAILY_QUOTES: DailyQuote[] = [
  { content: '不积跬步，无以至千里', author: '荀子' },
  { content: '千里之行，始于足下', author: '老子' },
  { content: '学而不思则罔，思而不学则殆', author: '孔子' },
  { content: '业精于勤，荒于嬉', author: '韩愈' },
  { content: '书山有路勤为径，学海无涯苦作舟', author: '韩愈' },
  { content: '天行健，君子以自强不息', author: '周易' },
  { content: '博观而约取，厚积而薄发', author: '苏轼' },
  { content: '纸上得来终觉浅，绝知此事要躬行', author: '陆游' },
  { content: '路漫漫其修远兮，吾将上下而求索', author: '屈原' },
  { content: '宝剑锋从磨砺出，梅花香自苦寒来', author: '佚名' },
  { content: '少壮不努力，老大徒伤悲', author: '汉乐府' },
  { content: '黑发不知勤学早，白首方悔读书迟', author: '颜真卿' },
  { content: '莫等闲，白了少年头，空悲切', author: '岳飞' },
  { content: '有志者，事竟成', author: '范晔' },
  { content: '锲而不舍，金石可镂', author: '荀子' },
  { content: '温故而知新，可以为师矣', author: '孔子' },
  { content: '三人行，必有我师焉', author: '孔子' },
  { content: '知之为知之，不知为不知，是知也', author: '孔子' },
  { content: '学而时习之，不亦说乎', author: '孔子' },
  { content: '吾生也有涯，而知也无涯', author: '庄子' },
  { content: '非淡泊无以明志，非宁静无以致远', author: '诸葛亮' },
  { content: '盛年不重来，一日难再晨', author: '陶渊明' },
  { content: '及时当勉励，岁月不待人', author: '陶渊明' },
  { content: '读书破万卷，下笔如有神', author: '杜甫' },
  { content: '问渠那得清如许，为有源头活水来', author: '朱熹' },
  { content: '山重水复疑无路，柳暗花明又一村', author: '陆游' },
  { content: '长风破浪会有时，直挂云帆济沧海', author: '李白' },
  { content: '天生我材必有用，千金散尽还复来', author: '李白' },
  { content: '会当凌绝顶，一览众山小', author: '杜甫' },
  { content: '欲穷千里目，更上一层楼', author: '王之涣' },
  { content: '不以规矩，不能成方圆', author: '孟子' },
  { content: '生于忧患，死于安乐', author: '孟子' }
]

export function getDailyQuote(): DailyQuote {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
}
