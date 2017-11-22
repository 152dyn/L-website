$(function() {
    let canvas = document.createElement("canvas");
    let minScreenWidth = Math.min( document.documentElement.clientWidth - 10, document.documentElement.clientHeight - 10 );
    canvas.width = minScreenWidth;
    canvas.height = minScreenWidth;
    document.getElementById("content").style.width =  minScreenWidth + "px";

     let util = {
        loadImg(e, fn) {
            return new Promise((resolve, reject) => {
                let img = new Image;
                if( typeof e !== "string" ) {
                    img.src = ( e.srcElement || e.target ).result;
                }else{
                    img.src = e;
                };
    
                img.onload = function() {
                    canvas.getContext("2d").drawImage( img, 0, 0 ,canvas.width, canvas.height);
                    resolve();
                };
            })
        }
    };

    function bindEvents() {
        let $file = $("#file");
        $file.on("change", function(e) {
            let reader = new FileReader;
            reader.onload = function(e) {
                util.loadImg(e).then(() => {
                    window.clipImage = new ClipImage(canvas, numbers[window.lev]);
                    window.clipImage.random();
                    Controller( window.clipImage, numbers[window.lev]);
                });
            };
            reader.readAsDataURL(this.files[0]);
        })
    }


    class Blocks {
        constructor(canvas, left, top, avW, avH) {
            this.canvas = canvas;
            this.left = left;
            this.top = top;
            this.avW = avW;
            this.avH = avH;
            this.init();
        }
        init() {
            $(this.canvas).css({
                position: "absolute",
                left: this.avW * this.left,
                top: this.avH * this.top
            })
            this.canvas.x = this.left;
            this.canvas.y = this.top;
            document.getElementById("content").appendChild( this.canvas );
        }

        setPosition() {
            $(this.canvas).css({
                left: this.avW*this.canvas.x,
                top: this.avH*this.canvas.y
            })
        }

        upF(maps, numbers) {
            let temp = (this.canvas.y > 0 ? (this.canvas.y - 1) : this.canvas.y);
            let targetXY = `${temp}_${this.canvas.x}`;
            return new Promise((resolve, reject) => {
                if(!maps[targetXY]) {
                    this.canvas.y = temp;
                    this.canvas.map = targetXY;
                    resolve(this.canvas);
                }
                reject();
            })
        }

        rightF(maps, numbers) {
            let temp = (this.canvas.x + 1 > numbers -1) ? this.canvas.x : this.canvas.x + 1;
            let targetXY = `${this.canvas.y}_${temp}`;
            return new Promise((resolve, reject) => {
                if( !maps[targetXY] ) {
                    this.canvas.x = temp;
                    this.canvas.map = targetXY;
                    resolve(this.canvas);
                };
                reject();
            })
        }

        downF(maps, numbers) {
            let temp = (this.canvas.y + 1>numbers-1) ? this.canvas.y : this.canvas.y + 1;
            let targetXY = `${temp}_${this.canvas.x}`;
            return new Promise((resolve, reject) => {
                if( !maps[targetXY] ) {
                    this.canvas.y = temp;
                    this.canvas.map = targetXY;
                    resolve(this.canvas);
                };
                reject();
            })
        }

        leftF(maps, numbersm) {
            let temp = (this.canvas.x-1) >= 0 ? this.canvas.x-1 : this.canvas.x;
            let targetXY = `${this.canvas.y}_${temp}`;
            return new Promise((resolve, reject) => {
                if( !maps[targetXY] ) {
                    this.canvas.x = temp;
                    this.canvas.map = targetXY;
                    resolve(this.canvas);
                };
                reject();
            })
        }
    }
    class ClipImage {
        constructor(canvas, number) {
            this.blocks = []; 
            this.instances = []; 
            this.maps = {};
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");
            this.number = number;
            this.clip();
        }
        clip() {
            let avH = this.avH = this.canvas.height / this.number,
                avW = this.avW = this.canvas.width / this.number;
            
            for(let i = 0; i < this.number; i++) {
                for(let j = 0; j < this.number; j++) {
                    this.blocks[i] = this.blocks[i] || [];
                    let canvas = document.createElement("canvas");
                    canvas.width = avW;
                    canvas.height = avH;
                    canvas.x = j;
                    canvas.y = i;
                    canvas.map = `${i}_${j}`;
                    canvas.correctMap = `${i}_${j}`;
                    let imageDate = this.context.getImageData(j * avW, i * avH, avW, avH);
                    canvas.getContext("2d").putImageData(imageDate, 0, 0);

                    // 鍘婚櫎鍙充笅瑙�
                    if( i === j && j=== (this.number-1) ) break;
                    this.blocks[i][j] = canvas;
                }
            };
            this.renderToDom();
        }

        renderToDom() {
            $("#content").html("");
            this.maps = {};
            this.doms = [];
            this.instances = [];

            for(let i = 0; i < this.blocks.length; i++) {
                for(let j = 0; j < this.blocks[i].length; j++) {
                    let instance = new Blocks(this.blocks[i][j], j, i, this.avW, this.avH)
                    this.instances.push(instance);
                    this.maps[`${i}_${j}`] = true;
                }
            }
        }
        /**
         * @param 鎶奵anvas鍧楁贩鎺掞紝 鎵撲贡鎺掑簭;
         * */
        random() {
            let len = this.instances.length;
            $("#content").empty();
            this.blocks = _.shuffle(this.blocks);
            for(let i=0 ;i <this.blocks.length; i++) {
                this.blocks[i] = _.shuffle(this.blocks[i]);
            }
            this.renderToDom();
        }

        updataDom(cav, obj) {
            this.updataMap();
            $(cav).animate({
                top: obj.y * this.avH,
                left: obj.x * this.avW
            });
        }

        updataMap() {
            this.maps = {};
            let len = this.instances.length;
            while(len--) {
                this.maps[`${this.instances[len].canvas.y}_${this.instances[len].canvas.x}`] = true;
                this.instances[len].canvas.map = `${this.instances[len].canvas.y}_${this.instances[len].canvas.x}`;
            };
        }

        testSuccess() {
            let len = this.instances.length;
            while(len--) {
                if(this.instances[len].canvas.correctMap !== this.instances[len].canvas.map) {
                    return ;
                 };
            }
            alert("瀹屾垚!")
            $("#now").html( window.lev + 1 );
            $(".progress-bar").width( (window.lev+ 1) * 25 + "%" );
            init(window.lev);
        }
    }
    
    function Controller(clipImage, number) {
        let run = function (clipImage, name) {
            for(let i = 0; i < clipImage.instances.length; i++) {
                let instance = clipImage.instances[i];
                instance[name](clipImage.maps, number).then((canvas) => {
                    clipImage.updataDom(canvas, {
                        x : canvas.x,
                        y : canvas.y
                    })
                    clipImage.testSuccess();
                    return;
                }).catch(() => {})
            }
        }
        $(document).on("tochmove", function(e) {
            e.preventDefault();
        })
        $(document).swipeLeft(function() {
            run(clipImage,"leftF")
        }).swipeUp(function() {
            run(clipImage,"upF")
        }).swipeRight(function() {
            run(clipImage,"rightF")
        }).swipeDown(function() {
            run(clipImage,"downF")
        });
    }
    const levels = ["./images/lake.jpg", "./images/lake.jpg"];
    const numbers = [3 , 4];
    function init(level) {
        util.loadImg(levels[level]).then(() => {
            window.clipImage = new ClipImage(canvas, numbers[level]);
            window.clipImage.random();
            Controller( window.clipImage, numbers[level] || 3);
        })
    }

    window.lev = 0;
    init(lev);
    bindEvents();
})