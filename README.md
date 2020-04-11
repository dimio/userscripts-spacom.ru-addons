# Spacom.ru Addons: пользовательские скрипты для браузерной космической стратегии spacom.ru

>Вселенная [Spacom](https://spacom.ru) огромная — сотни звездных систем и тысячи планет. Планеты отличаются типом, размером, природными ресурсами. Некоторые пригодны для жизни и процветания, другие только для производства и добычи минералов.\
На некоторых планетах уже живут другие игроки. Найдите самые богатые звезды с помощью зондов-разведчиков и заселите их, используя корабли-колонии.\
Стройте корабли с помощью Верфи на промышленных планетах, формируйте из них флоты и отправляйте в космос. Создавайте в конструкторе свои космические кораблей с помощью корпусов, двигателей, оружия и брони

## Содержание
+ [Установка](#установка)
+ [Список дополнений](#список-дополнений)
+ [Системные требования](#требования)
+ [Поддержка](#поддержка)

## Установка

* Описана установка в Chrome + [Tampermonkey](http://tampermonkey.net/)
* Для установки дополнений - перейти к нужному по ссылке и нажать кнопку "Raw", Tampermonkey автоматически предложит установить дополнение
* Установить [Spacom.Addons](./Addons/Addons.user.js) (набор библиотечных функций для остальных дополнений)
* Установить нужные дополнения из [списка дополнений](#список-дополнений), как отдельные пользовательские скрипты

## Список дополнений

+ ### Флоты
    * [Spacom.Addons.Fleets.Sort](./Addons/Fleets/Sort.user.js) - сортировка флотов:
        - Разделение вкладки флотов на "Гарнизон", свои и чужие флоты, флоты пиратов
        - Фильтрация и сортировка флотов по различным параметрам (поддерживаются множественные фильтры, исключающие фильтры, сортировка внутри отфильтрованного)
        - Результат фильтрации и/или сортировки сохраняется при совершении действий с флотами и переключении вкладок флотов
    * [Spacom.Addons.Fleets.MarkOnMap](./Addons/Fleets/MarkOnMap.user.js): позволяет отмечать выбранные флоты на карте, может использоваться совместно с сортировкой и фильтрацией, для работы необходимо дополнительно установить [Spacom.Addons.Map.Scene](./Addons/Map/Scene.user.js)
    * [Spacom.Addons.Fleets.Show](./Addons/Fleets/Show.user.js): показывает количество однотипных кораблей во флоте

+ ### Карта
    * [Spacom.Addons.Map.ShowViewZones](./Addons/Map/ShowViewZones.user.js): показать/скрыть зоны обзора флотов на карте

+ ### Конструктор кораблей
    * [Spacom.Addons.Design.Extensions](./Addons/Design/Extensions.user.js): позволяет менять максимальный уровень исследованных деталей (задаётся в настройках скрипта), выводит расширенную информацию по характеристикам проекта.

+ ### Системы, планеты
    * [Spacom.Addons.Stars.PlanetStats](./Addons/Stars/PlanetStats.user.js): выводит сумму базовых показателей всех планет в окне обзора системы, работает для систем с проведённой георазведкой

+ ### Внешний вид
    * [Spacom.Addons.Decor](./Addons/Decor/Decor.user.js): косметические изменения интерфейса (удобочитаемый формат чисел)

## Требования

* [Плагин Tampermonkey](http://tampermonkey.net/) или аналогичный (Greasemonkey, Ace Script, Violentmonkey и т.д.) для вашего браузера - по желанию

## Поддержка

* [GitHub issues](../../issues)
* [dimio.org](http://dimio.org), dimio+spacom@dimio.org
