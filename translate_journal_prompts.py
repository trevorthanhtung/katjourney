import json
import os

prompts_translations = {
    "vi": {
        "promptEmpty1": "Hôm nay bạn muốn nhớ nhất điều gì?",
        "promptEmpty2": "Có khoảnh khắc nào bạn muốn lưu lại không?",
        "promptEmpty3": "Một món ăn, một điểm đến hoặc một người bạn đã gặp?",
        "promptEmpty4": "Điều gì làm hành trình này trở nên khác biệt?",
        "promptSugg1": "Điều muốn nhớ nhất",
        "promptSugg2": "Món ăn đáng nhớ",
        "promptSugg3": "Người bạn đã gặp",
        "promptSugg4": "Khoảnh khắc vui",
        "promptSugg5": "Điều muốn nhớ mãi",
        "promptPrefix": "Gợi ý: "
    },
    "en": {
        "promptEmpty1": "What do you want to remember most today?",
        "promptEmpty2": "Is there a moment you want to save?",
        "promptEmpty3": "A dish, a destination, or a friend you met?",
        "promptEmpty4": "What makes this journey different?",
        "promptSugg1": "Most memorable thing",
        "promptSugg2": "Memorable dish",
        "promptSugg3": "Friend you met",
        "promptSugg4": "Happy moment",
        "promptSugg5": "Thing to remember forever",
        "promptPrefix": "Prompt: "
    },
    "zh": {
        "promptEmpty1": "你今天最想记住什么？",
        "promptEmpty2": "有你想保存的时刻吗？",
        "promptEmpty3": "一道菜，一个目的地，还是一个遇见的朋友？",
        "promptEmpty4": "是什么让这段旅程与众不同？",
        "promptSugg1": "最难忘的事",
        "promptSugg2": "难忘的美食",
        "promptSugg3": "遇见的朋友",
        "promptSugg4": "快乐时刻",
        "promptSugg5": "永远记住的事",
        "promptPrefix": "提示: "
    },
    "es": {
        "promptEmpty1": "¿Qué es lo que más quieres recordar hoy?",
        "promptEmpty2": "¿Hay algún momento que quieras guardar?",
        "promptEmpty3": "¿Un plato, un destino o un amigo que conociste?",
        "promptEmpty4": "¿Qué hace diferente a este viaje?",
        "promptSugg1": "Lo más memorable",
        "promptSugg2": "Plato memorable",
        "promptSugg3": "Amigo que conociste",
        "promptSugg4": "Momento feliz",
        "promptSugg5": "Algo para recordar siempre",
        "promptPrefix": "Sugerencia: "
    },
    "ja": {
        "promptEmpty1": "今日一番覚えておきたいことは何ですか？",
        "promptEmpty2": "保存しておきたい瞬間はありますか？",
        "promptEmpty3": "料理、目的地、または出会った友達ですか？",
        "promptEmpty4": "この旅を特別にするものは何ですか？",
        "promptSugg1": "一番の思い出",
        "promptSugg2": "思い出の料理",
        "promptSugg3": "出会った友達",
        "promptSugg4": "幸せな瞬間",
        "promptSugg5": "永遠に覚えておきたいこと",
        "promptPrefix": "ヒント: "
    },
    "pt": {
        "promptEmpty1": "O que você mais quer lembrar de hoje?",
        "promptEmpty2": "Há algum momento que você queira salvar?",
        "promptEmpty3": "Um prato, um destino ou um amigo que conheceu?",
        "promptEmpty4": "O que torna esta jornada diferente?",
        "promptSugg1": "Coisa mais memorável",
        "promptSugg2": "Prato memorável",
        "promptSugg3": "Amigo que conheceu",
        "promptSugg4": "Momento feliz",
        "promptSugg5": "Algo para lembrar para sempre",
        "promptPrefix": "Dica: "
    },
    "ko": {
        "promptEmpty1": "오늘 가장 기억하고 싶은 것은 무엇인가요?",
        "promptEmpty2": "저장하고 싶은 순간이 있나요?",
        "promptEmpty3": "음식, 목적지, 또는 만난 친구?",
        "promptEmpty4": "이 여행을 특별하게 만드는 것은 무엇인가요?",
        "promptSugg1": "가장 기억에 남는 일",
        "promptSugg2": "기억에 남는 음식",
        "promptSugg3": "만난 친구",
        "promptSugg4": "행복한 순간",
        "promptSugg5": "영원히 기억할 것",
        "promptPrefix": "힌트: "
    },
    "th": {
        "promptEmpty1": "วันนี้คุณอยากจำอะไรมากที่สุด?",
        "promptEmpty2": "มีช่วงเวลาที่คุณอยากบันทึกไว้ไหม?",
        "promptEmpty3": "อาหาร สถานที่ หรือเพื่อนที่เจอ?",
        "promptEmpty4": "อะไรทำให้การเดินทางครั้งนี้แตกต่าง?",
        "promptSugg1": "สิ่งที่น่าจดจำที่สุด",
        "promptSugg2": "อาหารที่น่าจดจำ",
        "promptSugg3": "เพื่อนที่เจอ",
        "promptSugg4": "ช่วงเวลาที่มีความสุข",
        "promptSugg5": "สิ่งที่ต้องจำตลอดไป",
        "promptPrefix": "คำใบ้: "
    },
    "de": {
        "promptEmpty1": "Woran möchten Sie sich heute am meisten erinnern?",
        "promptEmpty2": "Gibt es einen Moment, den Sie speichern möchten?",
        "promptEmpty3": "Ein Gericht, ein Ziel oder ein Freund, den Sie getroffen haben?",
        "promptEmpty4": "Was macht diese Reise besonders?",
        "promptSugg1": "Denkwürdigste Sache",
        "promptSugg2": "Denkwürdiges Gericht",
        "promptSugg3": "Getroffener Freund",
        "promptSugg4": "Glücklicher Moment",
        "promptSugg5": "Etwas, das man für immer erinnern sollte",
        "promptPrefix": "Tipp: "
    },
    "fr": {
        "promptEmpty1": "De quoi voulez-vous vous souvenir le plus aujourd'hui ?",
        "promptEmpty2": "Y a-t-il un moment que vous voulez sauvegarder ?",
        "promptEmpty3": "Un plat, une destination ou un ami rencontré ?",
        "promptEmpty4": "Qu'est-ce qui rend ce voyage différent ?",
        "promptSugg1": "Chose la plus mémorable",
        "promptSugg2": "Plat mémorable",
        "promptSugg3": "Ami rencontré",
        "promptSugg4": "Moment de bonheur",
        "promptSugg5": "Chose à retenir pour toujours",
        "promptPrefix": "Indice: "
    },
    "ru": {
        "promptEmpty1": "Что вы хотите запомнить больше всего сегодня?",
        "promptEmpty2": "Есть ли момент, который вы хотите сохранить?",
        "promptEmpty3": "Блюдо, место назначения или встреченный друг?",
        "promptEmpty4": "Что делает это путешествие особенным?",
        "promptSugg1": "Самое памятное",
        "promptSugg2": "Памятное блюдо",
        "promptSugg3": "Встреченный друг",
        "promptSugg4": "Счастливый момент",
        "promptSugg5": "То, что нужно помнить всегда",
        "promptPrefix": "Подсказка: "
    },
    "ar": {
        "promptEmpty1": "ما الذي تريد أن تتذكره أكثر اليوم؟",
        "promptEmpty2": "هل هناك لحظة تريد حفظها؟",
        "promptEmpty3": "طبق أم وجهة أم صديق قابلته؟",
        "promptEmpty4": "ما الذي يجعل هذه الرحلة مختلفة؟",
        "promptSugg1": "الشيء الأكثر ذكرى",
        "promptSugg2": "طبق لا ينسى",
        "promptSugg3": "صديق قابلته",
        "promptSugg4": "لحظة سعيدة",
        "promptSugg5": "شيء يجب تذكره إلى الأبد",
        "promptPrefix": "تلميح: "
    }
}

def translate_journal_prompts():
    locales_dir = "src/locales"
    for lang, trans in prompts_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = prompts_translations["en"]
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "journal" not in data:
                data["journal"] = {}
                
            for k, v in trans.items():
                data["journal"][k] = v
                
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

if __name__ == "__main__":
    translate_journal_prompts()
