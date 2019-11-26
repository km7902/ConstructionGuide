import { WEBGL } from '../lib/WebGL';
import Entity from './3d/entity';
import Grid from './3d/grid';
import Interface from './interface';
import * as THREE from 'three';
import * as OrbitControls from 'three-orbitcontrols';

/**
 * メインクラス
 */
export default class Main {

	/* キャンバスオブジェクト */
	private readonly _canvas;
	private _width: number;
	private _height: number;

	/* デバッグオブジェクト */
	private readonly _debug;

	/* ベースとなる URL */
	private readonly _baseURL;

	/* レンダラーオブジェクト */
	private readonly _renderer: THREE.WebGLRenderer;

	/* シーンオブジェクト */
	private readonly _scene: THREE.Scene;
	private readonly _scene2d: THREE.Scene;

	/* カメラオブジェクト */
	private readonly _camera: THREE.PerspectiveCamera;
	private readonly _camera2d: THREE.OrthographicCamera;

	/* カメラコントローラーオブジェクト */
	private readonly _orbitControls: OrbitControls;

	/* グリッドオブジェクト */
	private readonly _grid: Grid;

	/* エンティティオブジェクト */
	private readonly _entity: Entity;

	/* インターフェースオブジェクト */
	private readonly _interface: Interface;

	/* 現在のアイテム ID */
	private _itemID: string;

	/* 2D 側イベントの有無 */
	private _2dEvent: boolean;

	/* マウス座標管理のベクトル */
	private _mouseUV: THREE.Vector2;
	private _canvasUV: THREE.Vector2;

	/* キーの状態 */
	private _downKey: string[];
	private _ctrlKey: boolean;

	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor() {

		// バインド
		this._update    = this._update.bind(this);
		this._mousemove = this._mousemove.bind(this);
		this._mousedown = this._mousedown.bind(this);
		this._mouseup   = this._mouseup.bind(this);
		this._keydown   = this._keydown.bind(this);
		this._keyup     = this._keyup.bind(this);
		this._resize    = this._resize.bind(this);

		// キャンバスを取得
		this._canvas = document.getElementById('ConstructionGuideApp');
		this._width  = this._canvas.clientWidth;
		this._height = this._canvas.clientHeight;

		// フレームを取得
		const frame = document.getElementById('ConstructionGuideFrame');

		// WebGL に対応していないブラウザにメッセージを表示
		if (!WEBGL.isWebGLAvailable()) {

			frame.insertBefore(WEBGL.getWebGLErrorMessage(), this._canvas);
			this._canvas.style.display = 'none';
			return;
		}

		// デバッグを作成
		this._debug = document.createElement('span');
		this._debug.setAttribute('id', 'ConstructionGuideDebug');
		frame.appendChild(this._debug);

		// ベース URL を定義
		this._baseURL = frame.getElementsByTagName('script')[0].getAttribute('src').replace('js/ConstructionGuide.js', '');

		// スタイルシートを取得
		const stylesheet = document.createElement('link');
		stylesheet.setAttribute('rel', 'stylesheet');
		stylesheet.setAttribute('href', this._baseURL + 'css/ConstructionGuide.css');
		frame.appendChild(stylesheet);

		// レンダラーを作成
		this._renderer = new THREE.WebGLRenderer({

			canvas: this._canvas,
			antialias: true,
			alpha: true
		});
		// this._renderer.setClearColor(0x000000, 1);
		this._renderer.setSize(this._width, this._height);

		// シーンを作成
		this._scene = new THREE.Scene();

		// シーンを作成（2D）
		this._scene2d = new THREE.Scene();

		// カメラを作成
		this._camera = new THREE.PerspectiveCamera(

			45,
			this._width / this._height,
			1,
			100000
		);
		this._camera.position.set(1200, 600, 1200);
		this._camera.lookAt(new THREE.Vector3(0, 0, 0));

		// カメラを作成（2D）
		this._camera2d = new THREE.OrthographicCamera(

			this._width  / - 2,
			this._width  /   2,
			this._height /   2,
			this._height / - 2,
			0,
			1000
		);

		// カメラコントローラーを作成
		this._orbitControls = new OrbitControls(this._camera, this._canvas);

		// 滑らかにカメラコントローラーを制御する
		this._orbitControls.enableDamping = true;
		this._orbitControls.dampingFactor = 0.2;

		this._orbitControls.keys = {
			LEFT  : 65, // A key
			UP    : 87, // W key
			RIGHT : 68, // D key
			BOTTOM: 83  // S key
		}

		// 光源を作成
		// new THREE.AmbientLight(色, 光の強さ)
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
		this._scene.add(ambientLight);

		// new THREE.DirectionalLight(色, 光の強さ)
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(0, 1200, 400);
		this._scene.add(directionalLight);

		// ブロックのサイズと数
		const blockSize = 100;
		const blockStep = 50;

		// グリッドを作成する
		// @param {THREE.Scene} scene: 3D シーンオブジェクト
		// @param {number} blockSize: ブロックのサイズ
		// @param {number} blockStep: ブロックの数
		this._grid = new Grid(this._scene, blockSize, blockStep);

		// エンティティを作成する
		// @param {THREE.Scene} scene: 3D シーンオブジェクト
		// @param {string} baseURL: 外部リソースへの URL
		// @param {number} blockSize: ブロックのサイズ
		// @param {number} blockStep: ブロックの数
		this._entity = new Entity(this._scene, this._baseURL, blockSize, blockStep);

		// JSON データがあればエンティティの配置を復元
		if (this._canvas.innerHTML != '')
			this._entity._entitySpaceRecover(this._canvas.innerHTML);

		// インターフェースを作成する
		// @param {THREE.Scene} scene2d: 2D シーンオブジェクト
		// @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
		// @param {string} baseURL: 外部リソースへの URL
		this._interface = new Interface(this._scene2d, this._camera2d, this._baseURL);

		// 現在のアイテム ID を空気（何も持たない状態）にする
		this._itemID = '0';

		// マウスイベントを登録
		window.addEventListener('mousemove', this._mousemove);
		window.addEventListener('mousedown', this._mousedown);
		window.addEventListener('mouseup', this._mouseup);

		// マウス座標管理を初期化
		this._mouseUV  = new THREE.Vector2(this._width / 2, this._height / 2);
		this._canvasUV = new THREE.Vector2(0, 0);

		// キーボードイベントを登録
		window.addEventListener('keydown', this._keydown);
		window.addEventListener('keyup', this._keyup);

		// キーの状態を初期化
		this._downKey = [];
		this._ctrlKey = false;

		// リサイズを一度実行してからイベントを登録
		this._resize();
		window.addEventListener('resize', this._resize);

		// フレーム毎の更新
		this._update();
	}

	/**
	 * フレーム毎の更新
	 */
	private _update() {

		requestAnimationFrame(this._update);

		// カメラコントローラーを更新
		this._orbitControls.update();

		// 2D 側イベントがないとき
		if (!this._interface._update(this._mouseUV)) {

			// グリッド側の処理
			// @param {THREE.Vector2} mouseUV: マウスカーソル座標
			// @param {THREE.PerspectiveCamera} camera: 3D カメラオブジェクト
			// @param {boolean} action: 2D 側イベントの有無
			this._grid._update(this._mouseUV, this._camera, false);

			// エンティティ側の処理
			// @param {THREE.Vector2} mouseUV: マウスカーソル座標
			// @param {THREE.PerspectiveCamera} camera: 3D カメラオブジェクト
			// @param {boolean} action: 2D 側イベントの有無
			this._entity._update(this._mouseUV, this._camera, false);

			// 2D 側イベントが終了し、インベントリが開いてなければカメラコントローラーを再開
			if (this._2dEvent && !this._interface._getInventoryVisibility()) {

				this._2dEvent = false;
				this._orbitControls.enableZoom = true;
				this._orbitControls.enableRotate = true;
				this._orbitControls.enablePan = true;
			}

		// 2D 側イベントがあるとき
		} else {

			// グリッド側の処理
			// 第3引数により 2D 側イベントがあることを伝える
			this._grid._update(this._mouseUV, this._camera, true);

			// 2D 側イベントが終了するまでカメラコントローラーを休止
			this._2dEvent = true;
			this._orbitControls.enableZoom = false;
			this._orbitControls.enableRotate = false;
			this._orbitControls.enablePan = false;
		}

		// インベントリが開いているとき
		if (this._interface._getInventoryVisibility()) {

			// インベントリが閉じられるまでカメラコントローラーを休止
			this._orbitControls.enableZoom = false;
			this._orbitControls.enableRotate = false;
			this._orbitControls.enablePan = false;

		}

		// スライダーを動かした場合にエンティティ集合の Y 軸方向を動かす
		this._entity._setLevel(this._interface._getSliderInfo().level);

		// デバッグ表示用
		let debugText = '';
		let debugXYZ  = { x: '0', y: '0', z: '0' };

		// インベントリが開いているとき
		if (this._interface._getInventoryVisibility()) {

			debugXYZ.x = '-';
			debugXYZ.y = this._interface._getSliderInfo().level;
			debugXYZ.z = '-';

		} else {

			debugXYZ.x = this._grid._getPickGridX();
			debugXYZ.y = this._interface._getSliderInfo().level;
			debugXYZ.z = this._grid._getPickGridZ();
		}

		// デバッグ表示用文字列を構成
		debugText +=
			'XYZ: ' + debugXYZ.x +
			' / '   + debugXYZ.y +
			'.0 / ' + debugXYZ.z +
			'</span><br><span>';

		// アイテム ID を表示
		if (this._interface._getInterfaceItemID() != '')
			debugText += 'Block: ' + this._interface._getInterfaceItemID();
		else if (this._entity._getEntityItemID() != '')
			debugText += 'Block: ' + this._entity._getEntityItemID();
		else
			debugText += 'Block: ';

		// キーイベント情報
		debugText += '</span><br><span>KeyCode: ';
		for (let i = 0; i < this._downKey.length; i++)
			debugText += (i == 0 ? '' : ' + ') + this._downKey[i];

		// デバッグ表示
		this._debug.innerHTML = '<span>' + debugText + '</span>';

		// 描画（3D）が先
		this._renderer.autoClear = true;
		this._renderer.render(this._scene, this._camera);

		// 描画（2D）は後
		this._renderer.autoClear = false;
		this._renderer.render(this._scene2d, this._camera2d);
	}

	/**
	 * マウスイベント（移動）
	 * @param {object} event: イベント詳細
	 */
	private _mousemove(event) {

		let x = 0, y = 0, w = 0, h = 0;

		// canvas 要素をカーソルが移動したとき
		if (this._canvas == event.target) {

			const element = event.target;

			// canvas 要素上の XY 座標
			this._canvasUV.x = event.clientX - (event.pageX - event.offsetX) + window.scrollX;
			this._canvasUV.y = event.clientY - (event.pageY - event.offsetY) + window.scrollY;

			// canvas 要素の幅・高さ
			w = element.offsetWidth;
			h = element.offsetHeight;

			// -1 〜 +1 の範囲で現在のマウス座標を登録する
			this._mouseUV.x =  (this._canvasUV.x / w) * 2 - 1;
			this._mouseUV.y = -(this._canvasUV.y / h) * 2 + 1;
		}

		// 2D 側イベント処理
		// @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
		this._interface._mousemove(this._canvasUV);
	}

	/**
	 * マウスイベント（クリック押下）
	 * @param {object} event: イベント詳細
	 */
	private _mousedown(event) {

		// グリッドのマス目が選択状態、インベントリが非表示、ウィジェットに何か登録されているとき
		if ((<any>this._grid._getPickGridControl().material).opacity != 0 &&
			!this._interface._getInventoryVisibility() &&
			(this._itemID != '0' || event.button == 2)) {

			// エンティティ側の処理
			// グループへの登録は main.ts が処理しなければならない？
			this._entity._setEntityGroup(

				// @param {object} event: イベント情報
				// @param {string} itemID: アイテム ID
				// @param {boolean} ctrlKey: CTRL キーが押されているか
				// @param {THREE.Vector3} position: エンティティの登録位置
				this._entity._mousedown(

					event,
					this._itemID,
					this._ctrlKey,
					new THREE.Vector3(
						this._grid._getPickGridControl().position.x,
						this._interface._getSliderInfo().level,
						this._grid._getPickGridControl().position.z
					)
				)
			);

			// クリック開放が発生するまではカメラコントローラーを休止
			this._orbitControls.enableZoom = false;
			this._orbitControls.enableRotate = false;
			this._orbitControls.enablePan = false;
		}

		// 2D 側イベント処理
		// 現在使用中のアイテム ID を渡して変更があれば更新する
		// @param {object} event: イベント情報
		// @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
		// @param {string} itemID: アイテム ID
		const results = this._interface._mousedown(event, this._canvasUV, this._itemID);
		this._itemID = results.itemID;

		// カメラリセットがクリックされたとき
		if (results.functionsResult) {

			// カメラコントローラーの視点をリセット
			this._orbitControls.reset();
		}
	}

	/**
	 * マウスイベント（クリック開放）
	 * @param {object} event: イベント詳細
	 */
	private _mouseup(event) {

		// カメラコントローラーを再開
		if (!this._2dEvent) {

			this._orbitControls.enableZoom = true;
			this._orbitControls.enableRotate = true;
			this._orbitControls.enablePan = true;
		}

		// 2D 側イベント処理
		// 現在使用中のアイテム ID を渡して変更があれば更新する
		// @param {string} itemID: アイテム ID
		this._itemID = this._interface._mouseup(this._itemID);
	}

	/**
	 * キーボードイベント（キー押下）
	 * @param {object} event: イベント詳細
	 */
	private _keydown(event) {

		if (event.key == 'e') {

			// インベントリを表示・非表示
			this._interface._setInventoryVisibility();
		}

		if (event.key == 'Control') {

			// キーの状態を変更
			this._ctrlKey = true;
		}

		// 押下中のキーコードをデバッグ表示
		if (this._downKey.indexOf(event.code) < 0)
			this._downKey.push(event.code);
	}

	/**
	 * キーボードイベント（キー開放）
	 * @param {object} event: イベント詳細
	 */
	private _keyup(event) {

		if (event.key == 'Control') {

			// キーの状態を変更
			this._ctrlKey = false;
		}

		// 押下中のキーコードをデバッグ表示
		this._downKey = this._downKey.filter(function(item) {

			return item != event.code;
		});
	}

	/**
	 * リサイズ
	 */
	private _resize() {

		// 現在のウィンドウサイズに合わせる
		this._renderer.domElement.setAttribute('width', String(this._width));
		this._renderer.domElement.setAttribute('height', String(this._height));
		this._renderer.setSize(this._width, this._height);
	}
}

/**
 * エントリポイント
 */
window.addEventListener('load', () => {

	new Main();
});
