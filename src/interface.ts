import { SVGLoader } from '../lib/SVGLoader';
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

	/* 公開: デバッグ表示 */
	public _getInventoryItemID() {

		// ドラッグ中でない場合はインベントリから取得
		if (this._dragItem == null) {

			this._dragItemID = this._inventory._getInventoryItemChoose();

			// インベントリにない場合はウィジェットから取得
			if (this._dragItemID == '')
				this._dragItemID = this._widget._getWidgetItemChoose();
		}

		return this._dragItemID;
	}

	/* ドラッグ中に表示するアイテム */
	private _dragItem: THREE.Mesh;
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
		this._widget = new Widget(this._scene2d, baseURL);

		// スライダーを作成
		this._slider = new Slider(this._scene2d, baseURL);

		// インベントリを作成
		this._inventory = new Inventory(this._scene2d, baseURL, this._widget._getWidgetSize());

		// ドラッグ中に表示するアイテムの初期化
		this._dragItem = null;
	}

	/**
	 * フレーム毎の更新
	 * @param {THREE.Vector2} mouseUV: マウスカーソル座標
	 */
	public _update(mouseUV: THREE.Vector2) {

		// ウィジェット側の処理
		const hoverWidget = this._widget._update(mouseUV, this._camera2d);

		// スライダー側の処理
		const hoverSlider = this._slider._update(mouseUV, this._camera2d);

		// インベントリ側の処理
		const hoverInventory = this._inventory._update(mouseUV, this._camera2d);

		// main.ts にイベントの有無を通知する
		return hoverWidget || hoverSlider || hoverInventory;
	}

	/**
	 * マウスイベント（移動）
	 * @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
	 */
	public _mousemove(canvasUV: THREE.Vector2) {

		// ドラッグ中の場合
		if (this._dragItem != null) {

			// ドラッグ中に表示するアイテムをマウスカーソルに追従する
			this._dragItem.position.x = canvasUV.x - (this._width / 2);
			this._dragItem.position.y = (this._height / 2) - canvasUV.y;

		} else {

			// スライダー側の処理
			this._slider._mousemove(canvasUV);
		}
	}

	/**
	 * マウスイベント（クリック押下）
	 * @param {object} event: イベント情報
	 * @param {THREE.Vector2} canvasUV: マウスカーソル座標
	 * @param {string} itemID: アイテム ID
	 */
	public _mousedown(event, canvasUV: THREE.Vector2, itemID: string) {

		// ウィジェット側の処理
		itemID = this._widget._mousedown(event, itemID);

		// スライダー側の処理
		this._slider._mousedown();

		// インベントリ側の処理
		this._dragItem = this._inventory._mousedown(canvasUV, this._widget._getWidgetSize());

		// ドラッグ中に表示するアイテムがあるとき
		if (this._dragItem != null) {

			// ドラッグ開始
			this._scene2d.add(this._dragItem);
		}

		// main.ts に現在のアイテム ID を通知する
		return itemID;
	}

	/**
	 * マウスイベント（クリック開放）
	 * @param {string} itemID: アイテム ID
	 */
	public _mouseup(itemID: string) {

		// ドラッグ中に表示するアイテムがあるとき
		if (this._dragItem != null) {

			// ウィジェットにアイテムを登録
			itemID = this._widget._mouseup(itemID, this._dragItem.name);

			// ドラッグ終了
			this._scene2d.remove(this._dragItem);
			this._dragItem = null;
		}

		// スライダー側の処理
		this._slider._mouseup();

		// main.ts に現在のアイテム ID を通知する
		return itemID;
	}

	/**
	 * SVG ファイルを読み込む
	 * パスをシェイプに変換してグループ化しているが、テクスチャを貼ったスプライトより使いにくい
	 * よって、今のところ使用予定がないのでナレッジとして残しておく
	 * https://threejs.org/examples/#webgl_loader_svg
	 */
	_SVGLoader() {

		const guiData = {

			currentURL: 'img/chest.svg',
			drawFillShapes: true,
			drawStrokes: true,
			fillShapesWireframe: false,
			strokesWireframe: false,
			scene: this._scene2d,
			screenWidth: this._width,
			screenHeight: this._height
		}

		new SVGLoader().load(guiData.currentURL, function(data) {

			const paths = data.paths;

			const group = new THREE.Group();
			group.scale.multiplyScalar(0.15);
			group.position.set(guiData.screenWidth / 2.38, (guiData.screenHeight / - 2) + (guiData.screenHeight / 8), 0);
			group.scale.y *= - 1;

			for (let i = 0; i < paths.length; i++) {

				const path = paths[i];

				const fillColor = path.userData.style.fill;
				if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {

					const material = new THREE.MeshBasicMaterial({

						color: new THREE.Color().setStyle(fillColor),
						opacity: path.userData.style.fillOpacity,
						transparent: path.userData.style.fillOpacity < 1,
						side: THREE.DoubleSide,
						depthWrite: false,
						wireframe: guiData.fillShapesWireframe
					});

					const shapes = path.toShapes(true);

					for (let j = 0; j < shapes.length; j++) {

						const shape = shapes[j];

						const geometry = new THREE.ShapeBufferGeometry(shape);
						const mesh = new THREE.Mesh(geometry, material);

						group.add(mesh);
					}
				}

				const strokeColor = path.userData.style.stroke;

				if (guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {

					const material = new THREE.MeshBasicMaterial({

						color: new THREE.Color().setStyle(strokeColor),
						opacity: path.userData.style.strokeOpacity,
						transparent: path.userData.style.strokeOpacity < 1,
						side: THREE.DoubleSide,
						depthWrite: false,
						wireframe: guiData.strokesWireframe
					});

					for (let j = 0; j < path.subPaths.length; j++) {

						const subPath = path.subPaths[j];

						const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);

						if (geometry) {

							const mesh = new THREE.Mesh(geometry, material);

							group.add(mesh);
						}
					}
				}
			}

			guiData.scene.add(group);
		});
	}
}
