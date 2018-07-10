'use strict';

class Game {

	constructor () {
		this.canv = document.getElementById('canvas');
		this.ctx = this.canv.getContext('2d');

		this.width = 0;
		this.height = 0;

		this.recalcSize();

		window.addEventListener('resize', () => {
			this.recalcSize();
		}, false);
	};

	recalcSize () {
		this.canv.width = window.innerWidth || root.clientWidth || body.clientWidth;
		this.canv.height = window.innerHeight || root.clientHeight || body.clientHeight;

		this.width = this.canv.width;
		this.height = this.canv.height;
	};

	clear () {
		this.ctx.clearRect(0, 0, this.width, this.height);
	};

	play () {
		this.loop();
		window.requestAnimationFrame(this.play.bind(this));
	};

	loop () {
		this.clear();
		world.fillBackground();
		tiles.drawAllTiles();
		build.drawAllBuild();
	}
}

class Keys extends Game {

	constructor () {
		super();
		let self = this;

		this.mouse = {
			isDown: false,
			pos: {x: 0, y: 0},
			posDown: {x: 0, y: 0},
			posUp: {x: 0, y: 0}
		};

		this.canv.addEventListener('mousemove', (e) => {
			self.mouse.pos.x = e.layerX;
			self.mouse.pos.y = e.layerY;
		})
		this.canv.addEventListener('mousedown', (e) => {
			self.mouse.isDown = true;
			self.mouse.posDown = {x: e.pageX, y: e.pageY};
		})
		this.canv.addEventListener('mouseup', (e) => {
			self.mouse.isDown = false;
			self.mouse.posUp = {x: e.pageX, y: e.pageY};
		});
	};
}

class World extends Game {

	constructor () {
		super();

	};

	drawRectIsometric (iX, iY, x, y, color = '#555', isOutline = false, isCoord = false) {
		let colorOutline = '#fff';
		let tileHalfWidth = tiles.tileWidth / 2;
		let tileHalfHeight = tiles.tileHeight / 2;
		let offsetHalfX = x + tileHalfWidth;
		let offsetHalfY = y + tileHalfHeight;
		let offsetX = x + tiles.tileWidth;
		let offsetY = y + tiles.tileHeight;

		this.ctx.fillStyle = color;
		this.ctx.moveTo(x, y + tileHalfHeight);
		this.ctx.lineTo(offsetHalfX, y, offsetX, offsetHalfY);
		this.ctx.lineTo(offsetX, offsetHalfY, offsetHalfX, offsetY);
		this.ctx.lineTo(offsetHalfX, offsetY, x, offsetHalfY);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.beginPath();

		if (isOutline) {
			this.drawLine(x, offsetHalfY, offsetHalfX, y, colorOutline); // top
			this.drawLine(offsetHalfX, y, offsetX, offsetHalfY, colorOutline); // right
			this.drawLine(offsetX, offsetHalfY, offsetHalfX, offsetY, colorOutline); // bottom
			this.drawLine(offsetHalfX, offsetY, x, offsetHalfY, colorOutline); // left
		}

		if (isCoord) {
			this.ctx.fillStyle = colorOutline;
			this.ctx.fillText(iX +' : '+ iY, x + tileHalfWidth - 9, offsetY - tileHalfHeight + 3);
		}
	};

	drawLine (x1, y1, x2, y2, color = '#fff') {
		this.ctx.strokeStyle = color;
		this.ctx.beginPath();
		this.ctx.lineWidth = 1;
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.stroke();
	};

	fillBackground (color = '#000') {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(0, 0, this.width, this.height);
	};
}

class Tiles extends World {

	constructor (arrayTypes = [[0]], width = 60, height = 60, zoom = 1) {
		super();

		this.arrayTypes = arrayTypes.reverse();
		this.showCoordinates = true;
		this.colorOutline = '#ddd';
		this.colorGround = '#47b02e';
		this.colorSelect = '#b02e33';

		this.zoomDefault = zoom;
		this.zoomCurrent = this.zoomDefault;
		this.zoomPrev = this.zoomDefault;

		this.cntX = this.arrayTypes.length;
		this.cntY = this.arrayTypes[0].length;
		this.tileWidthDefault = width;
		this.tileHeightDefault = height;

		this.tilesCenterX = this.tileWidthDefault * this.cntX / 2;
		this.tilesCenterY = this.tileHeightDefault * this.cntY / 2;
		this.tileWidth = this.tileWidthDefault;
		this.tileHeight = this.tileHeightDefault;

		this.selectedTileX = -1;
		this.selectedTileY = -1;
		this.posDragStartX = 0;
		this.posDragStartY = 0;
		this.posDragStopX = 0;
		this.posDragStopY = 0;
		this.posDragX = 0;
		this.posDragY = 0;
		this.dragX = 0;
		this.dragY = 0;

		this.updParams();

		this.posX = this.width / 2 - this.tilesCenterX;
		this.posY = this.height / 2;

		this.moving(this.posX, this.posY);

		window.addEventListener('resize', () => {
			this.updParams();
		}, false);

		window.addEventListener('mousemove', (e) => {
			let pageX = e.pageX - this.tileWidth / 2 - this.posX;
			let pageY = e.pageY - this.tileHeight / 2 - this.posY;

			if (keys.mouse.isDown) {
				this.posDragStopX = this.posX;
				this.posDragStopY = this.posY;

				this.moving(e.pageX, e.pageY);
			} else {
				this.selectedTileX = Math.round((pageX / this.tileWidth - pageY / this.tileHeight) - 1);
				this.selectedTileY = Math.round((pageX / this.tileWidth + pageY / this.tileHeight) + 1);
			}
		});

		window.addEventListener('wheel', (e) => {
			if (e.deltaY > 0 && this.zoomCurrent > 1) // e.deltaY > 0 = scrollDown = zoomOut
				zoom -= 1 
			else if (e.deltaY < 0 && this.zoomCurrent < 3) // e.deltaY < 0 = scrollUp = zoomIn
				zoom += 1;

			this.zooming(zoom);
		});

		this.canv.addEventListener('mousedown', (e) => {
			this.posDragStartX = this.posX;
			this.posDragStartY = this.posY;
		});

		this.canv.addEventListener('mouseup', (e) => {
			this.posDragStopX = this.posX;
			this.posDragStopY = this.posY;

			if (false && this.zoomCurrent != this.zoomPrev) {
				if (this.zoomCurrent > this.zoomPrev) {
					console.info('zoomIn');
					//this.dragX *= this.zoomCurrent;
					//this.dragY *= this.zoomCurrent;
				} else {
					console.info('zoomOut');
					//this.dragX /= this.zoomCurrent;
					//this.dragY /= this.zoomCurrent;
				}
			}

			this.dragX += (this.posDragStopX - this.posDragStartX) * this.zoomCurrent;
			this.dragY += (this.posDragStopY - this.posDragStartY) * this.zoomCurrent;
		});
	};

	moving (x, y) {

		let downX = keys.mouse.posDown.x;
		let downY = keys.mouse.posDown.y;
		let absX = Math.abs(downX - x);
		let absY = Math.abs(downY - y);

		if (downX > x) this.posDragX = this.posDragStartX - absX; // left
		else this.posDragX = this.posDragStartX + absX; // right
		if (downY > y) this.posDragY = this.posDragStartY - absY; // top
		else this.posDragY = this.posDragStartY + absY; // bottom

		this.posX = this.posDragX;
		this.posY = this.posDragY;

		this.collisionBorder();
	};

	zooming (zoom) {
		if (zoom != this.zoomCurrent) {
			this.zoomPrev = this.zoomCurrent;
			this.zoomCurrent = zoom;
			this.collisionBorder();

			let centerX = this.width / 2 - this.tileWidth * this.cntX / 2;
			let centerY = this.height / 2;
			
			this.posX = centerX + this.dragX * this.zoomCurrent;
			this.posY = centerY + this.dragY * this.zoomCurrent;

			this.collisionBorder();
		}
	};

	collisionBorder () {
		this.updParams();

		let maxX = (this.tileWidth * this.cntX - this.width);
		let maxY = (this.tileHeight * this.cntY - this.height);
		let posYOffset = this.tilesCenterY + this.tileHeight / 2;

		if (this.posX >= 0) { // left
			this.posX = 0;
		}
		if (this.posX <= -maxX) { // right
			this.posX = -maxX;
		}
		if (this.posY >= posYOffset) { // top
			this.posY = posYOffset;
		}
		if (this.posY <= -maxY + posYOffset) { // bottom
			this.posY = -maxY + posYOffset;
		}

		this.updParams();
	};

	updParams () {
		this.tileWidth = this.tileWidthDefault * this.zoomCurrent;
		this.tileHeight = this.tileHeightDefault * this.zoomCurrent;
		this.tilesCenterX = this.tileWidth * this.cntX / 2;
		this.tilesCenterY = this.tileHeight * this.cntY / 2;
	};

	drawAllTiles () {
		for (let iX in this.arrayTypes) {
			for (let iY in this.arrayTypes[iX]) {
				let type = this.arrayTypes[iX][iY];
				this.drawTile(iX, iY);
			};
		};
	};

	drawTile (iX, iY) {
		let offsetX = iX * this.tileWidth / 2 + iY * this.tileWidth / 2 + this.posX;
		let offsetY = iY * this.tileHeight / 2 - iX * this.tileHeight / 2 + this.posY - this.tileHeight;
		
		this.drawRectIsometric(iX, iY, offsetX, offsetY, this.colorGround, true, true);
	};
}

class Build extends World {
	constructor () {
		super();
		this.isActive = false;
	};

	drawAllBuild () {
		for (let iX in tiles.arrayTypes) {
			for (let iY in tiles.arrayTypes[iX]) {
				let type = tiles.arrayTypes[iX][iY];
				this.drawBuild(iX, iY, type);
			};
		};
	};

	drawBuild (iX, iY, type) {
		let offsetX = iX * tiles.tileWidth / 2 + iY * tiles.tileWidth / 2 + tiles.posX;
		let offsetY = iY * tiles.tileHeight / 2 - iX * tiles.tileHeight / 2 + tiles.posY - tiles.tileHeight;
		switch (type) {
			case 1:
				world.drawRectIsometric(iX, iY, offsetX, offsetY, '#666', true, true);

				break;
			default:
				
				break;
		}
	};
}

let arrayTiles = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

let keys = new Keys();
let world = new World();
let tiles = new Tiles(arrayTiles, 120, 60, 1);
let build = new Build();

let game = new Game();


game.play();