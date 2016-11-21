       var util = {
           //функция генерирует целое случайное число из диапазона min max включительно
           randomInteger: function(min, max){
               return Math.floor(min + Math.random() * (max + 1 - min));
           }
       }
       
       //Расширяем базовый тип Функции, добавляя метод для объявления новых методов.
       //Метод становится доступен для всех базовых типов, Array, Element, Object и т.д.
       Function.prototype.method = function(name, func){
           //Запись метода в прототип происходит только при отсутствии конфликта имен
           if (!this.prototype[name]) {
               this.prototype[name] = func;
               return this;
           }
       };
       //Метод заполняет массив значениями по возрастанию, начиная от startValue
       Array.method("fillIncr", function(length, startValue){
           startValue = startValue || 0;
           for (var i=0 ; i<length ; i+=1){
               this.push(i+startValue);
           }
           return this;
       });
       //Метод проверяет все члены массива на соответствие value. Если все равны - 
       //вернёт true
       Array.method("allMembers", function(value){
           for (var i=0 ; i<this.length ; i+=1){
               if (this[i] !== value){
                   return false;
               }
           }
           return true;
       });
       //Метод находит член массива со значением find, меняет его на replace
       Array.method("findAndReplace", function(find, replace){
           var index = this.indexOf(find);
           if (index > -1){
               this[index] = replace;
           }
       });
       //Метод подобен shift и pop, но удаляет и возвращает случайный член массива 
       Array.method("popRandom", function(){
           return this.splice(Math.floor(Math.random()*this.length), 1)[0];
       });
       //Метод смешивает массив случайным образом
       Array.method("shuffle", function(){
           for (var i=0 ; i<this.length ; i+=1){
               var index = Math.floor(Math.random() * (i+1));
               var saved = this[index];
               this[index] = this[i];
               this[i] = saved;
           }
           return this; 
       });
       //Метод добавляет DOM элементу наименование класса, с проверкой на существование
       Element.method("addClass", function(className){
           var classes = this.className.split(" ");
           if (classes.indexOf(className) < 0){
               classes.push(className);
               this.className = classes.join(" ").trim();
           }
           return this;
       });
       //Метод удаляет DOM элементу наименование класса, с проверкой на существование
       Element.method("removeClass", function(className){
           var classes = this.className.split(" ");
           var index = classes.indexOf(className);
           if (index >= 0){
               classes.splice(classes.indexOf(className),1);
               this.className = classes.join(" ").trim();
           }
           return this;
       });
       
       //создаём глобальный объект, отвечающий за наше приложение
       var app = {};
       
       //создаём конструктор судоку. Аргумент - размер области.
       app.Sudoku = function(area){
           //Во избежание потери контекста, записываем переменную this в that
           //При вызове конструктора контекст - экземпляр нового объекта
           var that = this;
           area = area || 3;
           //Создаём DOM элемент таблицу, сразу присваиваем ей класс новым методом 
           //Element.addClass
           //На этом этапе элемент содержится в памяти, но не на экране. Для отображения
           //его необходимо вставить в существующий DOM элемент методом appendChild
           var table = document.createElement('table').addClass("sudoku");
           var expo = area * area;
           for (var i=0 ; i<expo ; i+=1){
               var row = table.insertRow(-1);
               for (var j=0 ; j<expo ; j+=1){
                   var cell = row.insertCell(-1);
                   switch (i%area){
                        case 0:
                           cell.addClass("top");
                        break;
                        case area-1:
                           cell.addClass("bottom");
                        break;
                   }
                   switch (j%area){
                        case 0:
                           cell.addClass("left");
                        break;
                        case area-1:
                           cell.addClass("right");
                        break;
                   }
               }
           }
           //Делаем переменные доступными для внешнего обращения
           that.table = table;
           that.expo = expo;
       }
       //Описываем прототип для типа Sudoku
       app.Sudoku.prototype = {
           //Метод заполняет игровое поле значениями из двухмерного массива values
           fill: function(values){
               var that = this;
               that.values = values;
               Array.prototype.forEach.call(that.table.rows, function(row, i){
                   Array.prototype.forEach.call(row.cells, function(cell, j){
                       cell.innerHTML = values[i][j];
                   });
               });
           },
           
           // метод скрывает count полей в случайном порядке, меняет их на поля для ввода
           hide: function(count){   
               var that = this;
               for (var i=0 ; i<count ; i+=1){
                   var proccessing = true;
                   //избегаем повторения полей, чтобы скрыть нужное количество
                   while(proccessing){
                       var rowNumber = util.randomInteger(0,that.expo-1);
                       var colNumber = util.randomInteger(0,that.expo-1);
                       //если поле уже скрыто, выбираем новое значение
                       if (!that.table.rows[rowNumber].cells[colNumber].hided){
                           that.table.rows[rowNumber].cells[colNumber].hided = true;
                           that.table.rows[rowNumber].cells[colNumber].innerHTML = "";
                           var editCell = document.createElement("input");
                           that.table.rows[rowNumber].cells[colNumber].appendChild(editCell);
                           that.table.rows[rowNumber].cells[colNumber].editCell = editCell;
                           //добавляем событие на изменение значения поля
                           editCell.addEventListener("change",function(){
                               //метод проверки, описан ниже
                               that.check();
                           });
                           proccessing = false;
                       }
                   }  
               }
               //выполняем проверку уже совпавших рядов. В идеале, таких быть не должно
               that.check();
               
           },
           //отмечает ячейку cell классом, либо снимает класс, в зависимости от state
           markCell: function(cell, state){
               if (state){
                    cell.addClass("marked");
               } else {
                    cell.removeClass("marked");
               }
           },
           //возвращает значение ячейки, для поля, либо простой ячейки
           getValue: function(cell){
               if (cell.editCell){
                   return parseInt(cell.editCell.value, 10);
               } else {
                   return parseInt(cell.innerHTML, 10);
               }
           },
           //отмечает строку целиком
           markRow: function(number){
               var that = this;
               Array.prototype.forEach.call(that.table.rows[number].cells, function(cell){
                  that.markCell(cell, true);
               });
           },
           //отмечает колонку целиком
           markColumn: function(number){
               var that = this;
               Array.prototype.forEach.call(that.table.rows, function(row){
                   that.markCell(row.cells[number], true);
               });
           },
           //отмечает область целиком
           markArea: function(number){
               var that = this;
               var area = Math.sqrt(that.expo);
               var startRow = parseInt(number/area, 10)*area;
               var startColumn = (number%area)*area;
               for (var i=0 ; i<area ; i+=1){
                   for (var j=0 ; j<area ; j++){
                       that.markCell(that.table.rows[i+startRow].cells[j+startColumn], true);
                   }
               }
           },
           //Снимает отметки со всего игрового поля
           unmark: function(){
               var that = this;
               Array.prototype.forEach.call(that.table.rows, function(row,i){
                   Array.prototype.forEach.call(row.cells, function(cell,j){
                       that.markCell(cell, false);                    
                   });
               });
           },
           //Возвращает номер области по номеру строки и столбца
           getArea: function(row, column){
               var that = this;
               var area = Math.sqrt(that.expo);
               return parseInt(row/area)*area + parseInt(column/area);
           },
           //Проверяет строки, столбцы и области на корректность заполнения.
           //Проверяет состояние игры
           check: function(){
               var that = this;
               that.unmark();
               //создаём и заполняем проверочные массивы. По ним отслеживаем,
               //чтобы значения не повторялись
               var  rows = [], columns = [], areas = [];
               for (var i=0 ; i<that.expo ; i+=1){
                   rows.push([].fillIncr(that.expo, 1));
                   columns.push([].fillIncr(that.expo, 1));
                   areas.push([].fillIncr(that.expo, 1));
               }
               //проверяем значения
               Array.prototype.forEach.call(that.table.rows, function(row,i){
                   Array.prototype.forEach.call(row.cells, function(cell,j){
                       var value = that.getValue(cell);
                       //в проверочных массивах заменяем существующие в игровом поле 
                       //значения на нули
                       rows[i].findAndReplace(value, 0);
                       columns[j].findAndReplace(value, 0);
                       areas[that.getArea(i, j)].findAndReplace(value, 0);
                   });
               });
               //проверяем правильность заполнения, создаём счетчик для проверки
               var correct = {
                   rows: 0,
                   columns: 0,
                   areas: 0
               };
               for (var i=0 ; i<that.expo ; i+=1){
                   //если все цифры в группе уникальны, помечаем группу, увеличиваем счетчик
                   if (rows[i].allMembers(0)){
                       that.markRow(i);
                       correct.rows += 1;
                   }
                   if (columns[i].allMembers(0)){
                       that.markColumn(i);
                       correct.columns += 1;
                   }
                   if (areas[i].allMembers(0)){
                       that.markArea(i);
                       correct.areas += 1;
                   }
               }
               //если все группы отмечены как правильные, игра заканчивается
               if (correct.rows === that.expo &&
                   correct.columns === that.expo &&
                   correct.areas === that.expo ){
                   //функцию win определяем на любом этапе (позднее), но обязательно проверяем
                   //её существование и тип
                   if (typeof(that.win) === "function"){
                       that.win();
                   }
               }
           },
       }
       
       //Создадим конструктор для типа Generator, который будет отвечать за генерацию базовых
       //значений и методы перемешивания
       app.Generator = function(area){
           var that = this;
           var expo = area*area;
           var base = [].fillIncr(expo, 1);
           var values = [];
           //создаем базовую сетку
           for (var i=0 ; i<expo ; i+=1 ){
               var row = [];
               var start = (i%area)*area + parseInt(i/area, 10);
               for (var j=0; j<expo ; j+=1){
                   row.push(base.slice(start,expo).concat(base)[j]);
               }
               values.push(row);
           }
           that.values = values;
           that.expo = expo;
           that.area = area;
       }
       
       //Описываем прототипные методы
       app.Generator.prototype = {
           //отразить по горизонтали
           invertHorizontal: function(){
               var that = this;
               for (var i=0 ; i<that.expo ; i+=1){
                   that.values[i].reverse();
               }
               return that;
           },
           //отразить по вертикали
           invertVertical: function(){
               var that = this;
               that.values.reverse();
               return that;
           },
           //возвращает два случайных числа из диапазона длины области
           getPositions: function(){
               var source = [].fillIncr(this.area);
               var positions = {
                   startPos: source.popRandom(),
                   destPos: source.popRandom()
               }
               return positions;
           },
           //перемешать строки
           swapRows: function(count){
               var that = this;
               for (var i=0 ; i<count ; i+=1){
                   var area = util.randomInteger(0, that.area-1);
                   var values = that.getPositions();
                   var sourcePosition = area*that.area + values.startPos;
                   var destPosition = area*that.area + values.destPos;
                   var row = that.values.splice(sourcePosition,1)[0];
                   that.values.splice(destPosition,0,row);
               }
               return that;
           },
           //перемешать колонки
           swapColumns: function(count){
               var that = this;
               for (var i=0 ; i<count ; i+=1){
                    var area = util.randomInteger(0, that.area-1);
                    var values = that.getPositions();
                    var sourcePosition = area*that.area + values.startPos;
                    var destPosition = area*that.area + values.destPos;
                    for (var j=0 ; j<that.expo ; j+=1){
                        var cell = that.values[j].splice(sourcePosition, 1)[0];
                        that.values[j].splice(destPosition,0,cell);
                    }
               }
               return that;
           },
           //перемешать горизонтальные области   
           swapRowsRange: function(count){
               var that = this;
               for (var i=0 ; i<count ; i+=1){
                   var values = that.getPositions();
                   var rows = that.values.splice(values.startPos*that.area, that.area);
                   var args = [values.destPos*that.area, 0].concat(rows);
                   that.values.splice.apply(that.values, args);
                   //для метода splice для вставки требуются отдельные аргументы, если количество
                   //аргументов не известно, можно воспользоваться методом apply
                   //---that.values.splice(destPosition*that.area, 0, row[0], row[1], row[2]);
               }
               return that;
           },
           //перемешать вертикальные области
           swapColumnsRange: function(count){
               var that = this;
               for (var i=0 ; i<count ; i+=1){
                   var values = that.getPositions();
                   for (var j=0 ; j<that.expo ; j+=1){
                        var cells = that.values[j].splice(values.startPos*that.area, that.area);
                        var args = [values.destPos*that.area, 0].concat(cells);
                       //доработать
                        that.values[j].splice.apply(that.values[j], args);
                   }
               }
               return that;
           },
           //заменить все цифры в таблице значений
           shakeAll: function(){
               var that = this;
               var shaked = [].fillIncr(that.expo, 1);
               //смешиваем массив случайным образом
               shaked.shuffle();
               for (var i=0 ; i<that.expo ; i+=1){
                   for (var j=0 ; j<that.expo ; j+=1){
                       that.values[i][j] = shaked[that.values[i][j]-1];
                   }
               }
               return that;
           }
       }
       
       app.Timer = function(){
           var that = this;
           var content = document.createElement("div").addClass("timer");
           var display = document.createElement("div").addClass("display");
           content.appendChild(display);
           that.now = 0;
           //При использовании функции setInterval следует помнить, что она возвращает лишь
           //идентификатор таймера. Если мы удалим или перезапишем переменную that.timer
           //(или др.), сам таймер будет продолжать работать. Если нужно остановить таймер,
           //необходимо воспользоваться функцией clearInterval(идентификатор)
           //либо clearTimeout(ид) для функции setTimeout(). Время задаётся в мс.
           that.timer = setInterval(function(){
               that.now += 1;
               that.refresh();
           }, 1000);
           that.content = content;
           that.display = display;
           that.refresh();
       }
       app.Timer.prototype = {
           refresh: function(){
               var that = this;
               that.display.innerHTML = "Прошло времени: " + that.now + " сек."
           },
           getScore: function(){
               var that = this;
               return this.now;
           },
           stop: function(){
               clearInterval(this.timer);
           }
       }
       
       app.parameters = {
           area: 3,        
           shuffle: 5,      
           hided: 1,
           Players: [],
           PlayersPoint: []      
       }
       
       function SaveToC(){ 
        for (var i = 0; i < app.parameters.Players.length; i++){ 
            document.cookie = app.parameters.Players[i] + "=" + app.parameters.PlayersPoint[i]; 
        } 
       } 

       function GetCookie(name) { 
        var nameEQ = name + "="; 
        var ca = document.cookie.split(';'); 
        for(var i=0; i < ca.length; i++) 
        { 
            var c = ca[i]; 
            while (c.charAt(0)==' ') c = c.substring(1, c.length); 
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length); 
        } 
        return null; 
    } 

       function getAllCookies(){ 
        app.parameters.PlayersPoint = []; 
        for (var i = 0; i < app.parameters.Players.length; i++){ 
            var s = GetCookie(app.parameters.Players[i]); 
            app.parameters.PlayersPoint.push(s); 
        } 
    } 

    function updateBoard(){ 
        getAllCookies(); 
        var div = document.getElementById("linesTable"); 
        div.innerHTML="";
        for (var i = 0; i < app.parameters.Players.length; i++){ 
            var newLine = document.createElement('p'); 
            newLine.innerHTML = app.parameters.Players[i] + " = " + app.parameters.PlayersPoint[i]; 
            div.appendChild(newLine); 
        } 
    }
       

       var program = function(){
           document.getElementById("playGround").innerHTML="";
           var lvlarr = document.getElementsByName("lvl");
           if(lvlarr[0].checked==true){
               app.parameters.hided=1;
           }
           if(lvlarr[1].checked==true){
               app.parameters.hided=30;
           }
           if(lvlarr[2].checked==true){
               app.parameters.hided=45;
           }
           var CurName = document.getElementById("inputName").value;
           if(CurName==""){
               alert("Назвоись, путник, чтобы начать игру!");
               return;
           }
           else{
               app.parameters.Players.push(CurName);
           }
           document.getElementById("inputName").value="";
           
           var tbl = new app.Sudoku(app.parameters.area);
           document.body.querySelector("#playGround").appendChild(tbl.table);
           var generator = new app.Generator(app.parameters.area);
           
           generator.swapColumnsRange(app.parameters.shuffle)
                    .swapRowsRange(app.parameters.shuffle)
                    .swapColumns(app.parameters.shuffle)
                    .swapRows(app.parameters.shuffle)
                    .shakeAll();
           tbl.fill(generator.values);
           tbl.hide(app.parameters.hided);
           var timer = new app.Timer();
           document.body.querySelector("#playGround").appendChild(timer.content);
           tbl.win = function(){
               app.parameters.PlayersPoint.push(timer.getScore());
               SaveToC();
               updateBoard();
               timer.stop();
               alert("THE VICTORY IS YOURS!!!");
           }
       };       