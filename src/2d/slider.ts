import * as THREE from 'three';

/**
 * スライダークラス
 */
export default class Slider {

	/* キャンバスオブジェクト */
	private readonly _canvas;
	private _width: number;
	private _height: number;

	/* テクスチャ配列オブジェクト */
	private readonly _textureList: THREE.Texture[];

	/* スライダーの状態 */
	private _sliderInfo;

	/* 公開: 3D 側で高度を取得するため */
	public _getSliderInfo() {

		return this._sliderInfo;
	}

	/* スライダー制御オブジェクト */
	private _sliderControl: THREE.Sprite[];

	/* マウス操作 */
	private _dragSlider: boolean;
	private _hoverSlider: boolean;

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene2d: 2D シーンオブジェクト
	 * @param {string} baseURL: 外部リソースへの URL
	 */
	constructor(scene2d: THREE.Scene, baseURL: string) {

		// キャンバスを取得
		this._canvas = document.getElementById('ConstructionGuideApp');
		this._width = this._canvas.clientWidth;
		this._height = this._canvas.clientHeight;

		// テクスチャを読み込む
		this._textureList = [];

		// スライダーバーテクスチャ
		this._textureList.push(new THREE.TextureLoader().load(baseURL + 'img/slider_bar.png'));
		this._textureList[0].magFilter = THREE.NearestFilter;
		this._textureList[0].minFilter = THREE.NearestFilter;
		this._textureList[0].type = THREE.FloatType;

		// スライダーピンチテクスチャ
		this._textureList.push(new THREE.TextureLoader().load(baseURL + 'img/slider_pinch.png'));
		this._textureList[1].magFilter = THREE.NearestFilter;
		this._textureList[1].minFilter = THREE.NearestFilter;
		this._textureList[1].type = THREE.FloatType;

		// スライダーは最短を 256 とし、それ以上は画面の高さから算出
		const h = this._height / 2 < 256 ? 256 : this._height / 2;

		// スライダーの状態を初期化
		// current: 現在の高度（初期値:63 = 海抜）
		// high:    建築限界高度（地上）
		// low:     建築限界高度（地下）
		// ratio:   高度ごとのピクセル比率
		this._sliderInfo = {

			level: 63,
			high: this._height - (this._height - h) / 2,
			low: (this._height - h) / 2,
			ratio: h / 256
		}

		// マウスとの交差を調べたいものはスライダー制御に格納する
		this._sliderControl = [];

		// スライダーバーを作成
		const sliderBarSprite = new THREE.Sprite(

			new THREE.SpriteMaterial({ map: this._textureList[0], transparent: true })
		);
		sliderBarSprite.position.set(this._width / 2.2, 0, -1);
		sliderBarSprite.scale.set(this._width / 20, h, 1);
		scene2d.add(sliderBarSprite);

		// スライダーピンチを作成
		const sliderPinchSprite = new THREE.Sprite(

			new THREE.SpriteMaterial({ map: this._textureList[1], transparent: true })
		);
		sliderPinchSprite.position.set(this._width / 2.2, (this._sliderInfo.level - 128) * this._sliderInfo.ratio, 0);
		sliderPinchSprite.scale.set(this._width / 20, this._height / 28, 1);
		scene2d.add(sliderPinchSprite);

		// スライダー制御に追加
		this._sliderControl.push(sliderPinchSprite);

		// レイキャストを作成
		this._raycaster = new THREE.Raycaster();
	}

	/**
	 * フレーム毎の更新
	 * @param {THREE.Vector2} mouseUV: マウスカーソル座標
	 * @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
	 */
	public _update(mouseUV: THREE.Vector2, camera2d: THREE.OrthographicCamera) {

		// マウス位置からまっすぐに伸びる光線ベクトルを生成
		this._raycaster.setFromCamera(mouseUV, camera2d);

		// その光線とぶつかったオブジェクトを得る
		let intersects = this._raycaster.intersectObjects(this._sliderControl);
		this._hoverSlider = false;
		this._sliderControl.map(sprite => {

			if (intersects.length > 0 && sprite === intersects[0].object) {

				// 2D 側でオブジェクトを得たことを通知する
				this._hoverSlider = true;
			}
		});

		// interface.ts に通知する
		return this._hoverSlider;
	}

	/**
	 * マウスイベント（移動）
	 * @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
	 */
	public _mousemove(canvasUV: THREE.Vector2) {

		// スライダーピンチをドラッグしたとき
		if (this._dragSlider && canvasUV.y >= this._sliderInfo.low && canvasUV.y <= this._sliderInfo.high) {

			// スライダーピンチを動かす
			this._sliderControl[0].position.y = (this._height / 2) - canvasUV.y;

			// 現在の高度を割り出す
			this._sliderInfo.level = Math.floor(

				(this._sliderControl[0].position.y +
				(this._sliderInfo.high - this._sliderInfo.low) / 2) / this._sliderInfo.ratio
			);
		}
	}

	/**
	 * マウスイベント（クリック押下）
	 */
	public _mousedown() {

		// スライダーピンチの上にマウスカーソルがあるとき
		if (this._hoverSlider) {

			// ドラッグ開始を通知
			this._dragSlider = true;
		}
	}

	/**
	 * マウスイベント（クリック開放）
	 */
	public _mouseup() {

		// ドラッグ終了を通知
		this._dragSlider = false;
	}
}
