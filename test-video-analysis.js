/**
 * Test script for video analysis functionality
 * This script simulates sending video analysis data to the dashboard
 */

// Sample video analysis data based on your OpenAI response format
const sampleVideoAnalysisData = [
  {
    "id": "resp_05f6b93d010ed7fc0068e41f811088819d9a70c974e86af46e",
    "object": "response",
    "created_at": 1759780737,
    "status": "completed",
    "background": false,
    "billing": {
      "payer": "developer"
    },
    "error": null,
    "incomplete_details": null,
    "instructions": null,
    "max_output_tokens": null,
    "max_tool_calls": null,
    "model": "gpt-5-mini-2025-08-07",
    "output": [
      {
        "id": "rs_05f6b93d010ed7fc0068e41f82b794819d8689cf1f4c3bd249",
        "type": "reasoning",
        "summary": []
      },
      {
        "id": "msg_05f6b93d010ed7fc0068e41fc0e524819d97370461e76008c8",
        "type": "message",
        "status": "completed",
        "content": [
          {
            "type": "output_text",
            "annotations": [],
            "logprobs": [],
            "text": "1. Технический блок\n• Формат: вертикаль (ориентировано на TikTok/Reels), длительность ≈30 с.  \n• Качество: резкость в большинстве кадров чёткая; контраст средний, встречаются приглушённые кадры, блики и отражения на капоте; съёмка полупрофессиональная, стабильные статичные кадры.  \n• Субтитры: закрытых субтитров нет; есть крупные текстовые оверлеи (вопросы, цена, призыв), читаемость переменная.\n\n2. Визуал и монтаж\n• Первые 3–5 секунд: крупный план передней части автомобиля + девушка‑презентер справа + вопросный текст «Хочете придбати собі автомобіль?» + видимые брендовые флаги/табличка «komisauto» (hook).  \n• Хронология: далее повторяющиеся 3/4 и фронтальные планы машины с ведущей и вопросными оверлеями («Але вам не вистачає коштів?»); в середине появляется ценовой оверлей «5 000 грн/міс» (≈24 с); в конце — призыв «Ставте + під цим відео».  \n• Темп: спокойный, статичные кадры, медленная смена ракурсов (~2 с на кадр), минимум динамики.  \n• Разнообразие сцен: низкое–среднее — много похожих ракурсов авто и одна ведущая.  \n• Общий стиль: полупрофессиональная постановка с элементами UGC (натуральная локация, минимум моушн‑графики).\n\n3. Кто в кадре\n• Люди: женщина ~20–22 года, дружелюбная/заинтересованная, обращается в камеру (продавец/ведущая).  \n• Инфлюенсеры: нет очевидных инфлюенсеров.  \n• Как показан продукт: автомобиль — герой ролика (45–60% кадра), фронт/3/4 крупно; человек выступает как социальный акцент.  \n• Видимость логотипа/цветов: «komisauto» на номерном знаке, вертикальные флаги «ПРОДАЖ/ВИКУП», красно‑белые акценты читаемы; ценники на лобовом часто нечитаемы (кроме кадра с «5 000 грн/міс»).\n\n4. Маркетинг\n• Тип оффера: продажа подержанных авто через комиссионный автосалон; есть ценовой сигнал рассрочки/платы в месяц.  \n• Стадия воронки: mid → bottom (генерация интереса и стимул к намерению — есть цена, но слабая прямая конверсионная кнопка).  \n• Соответствие плейсменту: частично соответствует (вертикалка, текст‑оверлеи, human hook), но требует более резкого hook, динамики и явного CTA для соцплощадок.\n\n5. Психология\n• Драйверы: заинтересованность/желание (вопросы), доверие через реальную локацию и брендинг, дружелюбие ведущей; нет FOMO/ограниченного предложения.  \n• Приёмы: вопросный хук для вовлечения, брендинг как авторитет/соцдоказ, ценовой сигнал для мотивации; соцдоказ и гарантийные сообщения отсутствуют.\n\n6. Продажи\n• CTA: текстовые оверлеи и призыв к комментированию («Ставте + під цим відео»); отсутствует явный контакт/кнопка «позвонить/записаться».  \n• Ценовые сигналы: есть явный кадр с «5 000 грн/міс», остальные ценники мелкие/нечитабельные.  \n• Гарантии/риск‑реверс: не указаны (нет упоминания гарантии, тест‑драйва или возврата).\n\n7. Метрики/прогноз\n• Rotation insight (Jun 30, 2025): при запуске 30.06 рекомендовано мониторить первые 7 дней и оперативно оптимизировать текст‑оверлеи и CTA; ожидаем среднюю CTR и неплохой просмотр за счёт узнаваемого бренда, но низкую конверсию без явного CTA.  \n• Novelty (0–100): 30 (типовой дилерский креатив, низкая инновационность).\n\n8. Рекомендации\n• 3 quick wins:\n  1) Увеличить контраст/размер оверлеев и сделать цену «5 000 грн/міс» постоянным и более заметным.  \n  2) Добавить явный CTA с контактом/кнопкой (звонок/запись/ссылка) в нижней трети и держать его на экране.  \n  3) Подрезать кадры (меньше неба, убрать провода), усилить подсветку лица, уменьшить блики на капоте.  \n• 2 тактические теста:\n  1) A/B: текущий вопросный хук vs показ цены в первые 1–2 с — сравнить CTR.  \n  2) A/B: добавить предложение гарантии/тест‑драйва или спецусловия рассрочки vs без — измерить лид‑конверсию.  \n• 1 стратегическая:\n  - Сделать серию коротких (≈15 c) вертикальных роликов с UGC‑отзывами/кейсами покупателей + явным CTA и простым объяснением условий финансирования для снижения CPA.\n\n9. Итог\n• Что рекламируется: Komis Auto Вінниця предлагает подержанные автомобили через комиссионный автосалон с сигналами рассрочки.  \n• Качество креатива: полупрофессиональное, стабильно снятое, но шаблонное.  \n• Сильные стороны: реальная локация, читаемый брендинг, дружелюбная ведущая, наличествует ценовой сигнал.  \n• Слабые стороны: низкая динамика, слабый/неочевидный CTA, часть текстов и ценников нечитаема, фоновые отвлекающие элементы и блики."
          }
        ],
        "role": "assistant"
      }
    ],
    "parallel_tool_calls": true,
    "previous_response_id": null,
    "prompt_cache_key": null,
    "reasoning": {
      "effort": "high",
      "summary": null
    },
    "safety_identifier": null,
    "service_tier": "default",
    "store": true,
    "temperature": 1,
    "text": {
      "format": {
        "type": "text"
      },
      "verbosity": "low"
    },
    "tool_choice": "auto",
    "tools": [],
    "top_logprobs": 0,
    "top_p": 1,
    "truncation": "disabled",
    "usage": {
      "input_tokens": 13325,
      "input_tokens_details": {
        "cached_tokens": 0
      },
      "output_tokens": 6450,
      "output_tokens_details": {
        "reasoning_tokens": 5056
      },
      "total_tokens": 19775
    },
    "user": null,
    "metadata": {}
  }
];

// Function to send test data to the dashboard
async function sendTestVideoAnalysis() {
    try {
        console.log('Sending test video analysis data...');
        
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-request-id': `test_video_${Date.now()}`
            },
            body: JSON.stringify(sampleVideoAnalysisData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Test video analysis data sent successfully:', result);
            return result;
        } else {
            console.error('❌ Failed to send test data:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('❌ Error sending test data:', error);
        return null;
    }
}

// Function to test the complete flow
async function testVideoAnalysisFlow() {
    console.log('🧪 Starting video analysis test...');
    
    // Send test data
    const result = await sendTestVideoAnalysis();
    
    if (result && result.success) {
        console.log('✅ Video analysis test completed successfully!');
        console.log('📊 Check your dashboard to see the video analysis display');
        console.log('🔗 Dashboard URL: http://localhost:3000');
    } else {
        console.log('❌ Video analysis test failed');
    }
}

// Export functions for use in browser console or other scripts
if (typeof window !== 'undefined') {
    window.testVideoAnalysisFlow = testVideoAnalysisFlow;
    window.sendTestVideoAnalysis = sendTestVideoAnalysis;
    console.log('🧪 Test functions available:');
    console.log('- testVideoAnalysisFlow() - Run complete test');
    console.log('- sendTestVideoAnalysis() - Send test data only');
}

// Auto-run test if this script is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    console.log('This script is designed to run in a browser environment.');
    console.log('Please open your browser console and run: testVideoAnalysisFlow()');
}
