import Functions from './2d/functions';
import Inventory from './2d/inventory';
import Slider from './2d/slider';
import Widget from './2d/widget';
import * as THREE from 'three';

/**
 * インターフェースクラス
 */
export default class Interface {

	/* キャンバスオブジェクト */
	private readonly _canvas;
	private _width: number;
	private _height: number;

	/* シーンオブジェクト */
	private readonly _scene2d: THREE.Scene;

	/* カメラオブジェクト */
	private readonly _camera2d: THREE.OrthographicCamera;

	/* ウィジェットオブジェクト */
	private readonly _widget: Widget;

	/* スライダーオブジェクト */
	private readonly _slider: Slider;

	/* ファンクションズオブジェクト */
	private readonly _functions: Functions;

	/* 公開: 3D 側で高度を取得するため */
	public _getSliderInfo() {

		return this._slider._getSliderInfo();
	}

	/* インベントリオブジェクト */
	private readonly _inventory: Inventory;

	/* 公開: インベントリ表示中はカメラコントローラーを停止するため */
	public _getInventoryVisibility() {

		return this._inventory._getInventoryGroup().visible;
	}

	/* 公開: キーボードでインベントリ表示・非表示を切り替えるため */
	public _setInventoryVisibility() {
	
		// ドラッグ中でない場合に切り替える
		if (this._dragItemMesh == null) {

			this._inventory._getInventoryGroup().visible =
			this._inventory._getInventoryGroup().visible ? false : true;
		}
	}

	/* 公開: デバッグ表示 */
	public _getInventoryItemID() {

		// ドラッグ中でない場合はインベントリから取得
		if (this._dragItemMesh == null) {

			this._dragItemID = this._inventory._getInventoryItemChoose();

			// インベントリにない場合はウィジェットから取得
			if (this._dragItemID == '')
				this._dragItemID = this._widget._getWidgetItemChoose();
		}

		return this._dragItemID;
	}

	/* ドラッグ中に表示するアイテム */
	private _dragItemMesh: THREE.Mesh;
	private _dragItemID: string;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene2d: 2D シーンオブジェクト
	 * @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
	 * @param {string} baseURL: 外部リソースへの URL
	 */
	constructor(scene2d: THREE.Scene, camera2d: THREE.OrthographicCamera, baseURL: string) {

		// キャンバスを取得
		this._canvas = document.getElementById('ConstructionGuideApp');
		this._width = this._canvas.clientWidth;
		this._height = this._canvas.clientHeight;

		// シーンを取得
		this._scene2d = scene2d;

		// カメラを取得
		this._camera2d = camera2d;

		// ウィジェットを作成
		// @param {THREE.Scene} scene2d: 2D シーンオブジェクト
		// @param {string} baseURL: 外部リソースへの URL
		this._widget = new Widget(this._scene2d, baseURL);

		// スライダーを作成
		// @param {THREE.Scene} scene2d: 2D シーンオブジェクト
		// @param {string} baseURL: 外部リソースへの URL
		this._slider = new Slider(this._scene2d, baseURL);

		// インベントリを作成
		// @param {THREE.Scene} scene2d: 2D シーンオブジェクト
		// @param {string} baseURL: 外部リソースへの URL
		// @param {number} widgetSize: ウィジェットの幅と高さ
		this._inventory = new Inventory(this._scene2d, baseURL, this._widget._getWidgetSize());

		// 機能を作成
		// @param {THREE.Scene} scene2d: 2D シーンオブジェクト
		this._functions = new Functions(this._scene2d);

		// ドラッグ中に表示するアイテムの初期化
		this._dragItemMesh = null;
	}

	/**
	 * フレーム毎の更新
	 * @param {THREE.Vector2} mouseUV: マウスカーソル座標
	 */
	public _update(mouseUV: THREE.Vector2) {

		// ウィジェット側の処理
		// @param {THREE.Vector2} mouseUV: マウスカーソル座標
		// @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
		const hoverWidget = this._widget._update(mouseUV, this._camera2d);

		// スライダー側の処理
		// @param {THREE.Vector2} mouseUV: マウスカーソル座標
		// @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
		const hoverSlider = this._slider._update(mouseUV, this._camera2d);

		// インベントリ側の処理
		// @param {THREE.Vector2} mouseUV: マウスカーソル座標
		// @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
		const hoverInventory = this._inventory._update(mouseUV, this._camera2d);

		// ファンクションズ側の処理
		// @param {THREE.Vector2} mouseUV: マウスカーソル座標
		// @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
		const hoverFunctions = this._functions._update(mouseUV, this._camera2d);

		// main.ts にイベントの有無を通知する
		return hoverWidget || hoverSlider || hoverInventory || hoverFunctions;
	}

	/**
	 * マウスイベント（移動）
	 * @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
	 */
	public _mousemove(canvasUV: THREE.Vector2) {

		// ドラッグ中の場合
		if (this._dragItemMesh != null) {

			// ドラッグ中に表示するアイテムをマウスカーソルに追従する
			this._dragItemMesh.position.x = canvasUV.x - (this._width / 2);
			this._dragItemMesh.position.y = (this._height / 2) - canvasUV.y;

		} else {

			// スライダー側の処理
			// @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
			this._slider._mousemove(canvasUV);
		}
	}

	/**
	 * マウスイベント（クリック押下）
	 * @param {object} event: イベント情報
	 * @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
	 * @param {string} itemID: アイテム ID
	 */
	public _mousedown(event, canvasUV: THREE.Vector2, itemID: string) {

		// ウィジェット側の処理
		// @param {object} event: イベント情報
		// @param {string} itemID: アイテム ID
		itemID = this._widget._mousedown(event, itemID);

		// スライダー側の処理
		this._slider._mousedown();

		// インベントリ側の処理
		// @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
		// @param {number} widgetSize: ウィジェットの幅と高さ
		this._dragItemMesh = this._inventory._mousedown(canvasUV, this._widget._getWidgetSize());

		// ファンクションズ側の処理
		const functionsResult = this._functions._mousedown();

		// ドラッグ中に表示するアイテムがあるとき
		if (this._dragItemMesh != null) {

			// ドラッグ開始
			this._scene2d.add(this._dragItemMesh);
		}

		// main.ts に現在のアイテム ID を通知する
		return { itemID: itemID, functionsResult: functionsResult };
	}

	/**
	 * マウスイベント（クリック開放）
	 * @param {string} itemID: アイテム ID
	 */
	public _mouseup(itemID: string) {

		// ドラッグ中に表示するアイテムがあるとき
		if (this._dragItemMesh != null) {

			// ウィジェットにアイテムを登録
			// @param {string} itemID: アイテム ID
			// @param {string} dragItemID: ドラッグ中のアイテム ID
			itemID = this._widget._mouseup(itemID, this._dragItemMesh.name);

			// ドラッグ終了
			this._scene2d.remove(this._dragItemMesh);
			this._dragItemMesh = null;
		}

		// スライダー側の処理
		this._slider._mouseup();

		// main.ts に現在のアイテム ID を通知する
		return itemID;
	}
}
