# Spacom.Addons.Stars.StateView
***Отображение дополнительной информации на вкладке "Планеты"***

## Основные возможности:
+ Отображение уровня ремонта (суммарный уровень верфей системы) рядом с информацией о верфях

## Пример работы
|Без скрипта|Со скриптом|
|---|---|
|![don't show total repair count](./img/stars/planets-state-view/state-view-total-repair-01.png)|![show total repair count](./img/stars/planets-state-view/state-view-total-repair-02.png)|

## Настройки
Включить или выключить отображение дополнительной информации можно, изменив настройки в тексте скрипта:
```js
OPT: {
      showRepairPercent: true, // <- true - показывать уровень ремонта, false - нет
    },
```