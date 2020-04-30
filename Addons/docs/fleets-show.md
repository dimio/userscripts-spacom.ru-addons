# Spacom.Addons.Fleets.Show
***Отображение дополнительной информации для флотов***

## Основные возможности:
+ Отображение количества однотипных кораблей в составе флота (работает для флотов на карте)
+ Отображение названия системы, в которой находится флот, после её координат (работает для флотов на карте и во вкладках флотов)

## Пример работы
|Без скрипта|Со скриптом|
|---|---|
|![disabled](./img/fleets-show/fleets-show-disabled-01.png)|![disabled](./img/fleets-show/fleets-show-enabled-01.png)|

## Настройки
Включить или выключить отображение дополнительной информации по флотам можно, изменив настройки в тексте скрипта:
```js
OPT: {
      showShipsCount: true, // <- true - показывать кол-во кораблей, false - нет
      showSystemName: true, // <- true - показывать название системы, false - нет
    }
```