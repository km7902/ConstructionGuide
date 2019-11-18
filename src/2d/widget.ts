import palette from '../palette';
import * as THREE from 'three';

/**
 * ウィジェットクラス
 */
export default class Widget {

	/* キャンバスオブジェクト */
	private readonly _canvas;
	private _width: number;
	private _height: number;

	/* テクスチャ配列オブジェクト */
	private _textureList: THREE.Texture[];

	/* ウィジェットの高さと幅 */
	private _widgetSize: number;

	/* 公開: インベントリと共有 */
	public _getWidgetSize() {

		return this._widgetSize;
	}

	/* ウィジェット配列オブジェクト */
	private _widgetList: THREE.Sprite[];

	/* ウィジェットストアに格納されたアイテム ID 一覧 */
	private _widgetItemList: string[];

	/* ウィジェットストア配列オブジェクト */
	private _widgetStoreList: THREE.Mesh[];
	private _widgetStoreID: number; // カーソルが乗っているウィジェットストアの ID

	/* ウィジェットの選択予定位置 */
	private _widgetEstimateChoose: number;

	/* ウィジェットの選択位置（n番目） */
	private _widgetChoose: number;

	/* 公開:デバッグ表示 */
	public _getWidgetItemChoose() {

		// Minecraft JavaEdition の ID を返す
		let jeid = '';
		for (let i = 0; i < this._widgetStoreList.length; i++) {

			if (this._widgetStoreID == this._widgetStoreList[i].id) {

				if (this._widgetItemList[i] != '0')
					jeid = palette.find((v) => v.id === this._widgetItemList[i]).jeid;
			}
		}
		return jeid;
	}

	/* マウス操作 */
	private _hoverWidget: boolean;

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene2d: 2D シーンオブジェクト
	 */
	constructor(scene2d: THREE.Scene) {

		// キャンバスを取得
		this._canvas = document.getElementById('app');
		this._width = this._canvas.clientWidth;
		this._height = this._canvas.clientHeight;

		// テクスチャを読み込む
		this._textureList = [];

		// ウィジェットテクスチャ
		for (let i = 0; i < 3; i++) {

			this._textureList.push(new THREE.TextureLoader().load('img/widget' + (i + 1) + '.png'));
			this._textureList[i].magFilter = THREE.NearestFilter;
			this._textureList[i].minFilter = THREE.NearestFilter;
			this._textureList[i].type = THREE.FloatType;
		}

		// ウィジェットストアテクスチャ
		this._textureList.push(new THREE.TextureLoader().load('img/palette.png'));
		this._textureList[3].magFilter = THREE.LinearFilter;
		this._textureList[3].minFilter = THREE.LinearFilter;
		this._textureList[3].type = THREE.FloatType;

		// 各ウィジェットの高さと幅を画面の高さから算出
		this._widgetSize = this._height / 10;

		// ウィジェットストアのアイテム ID を初期化
		this._widgetItemList = ['0', '0', '0', '0', '0', '0', '0', '0', '0'];

		// マウスとの交差を調べたいものは配列に格納する
		this._widgetList = [];
		this._widgetStoreList = [];

		// 9つ作成
		for (let i = 0; i < 9; i++) {

			const widgetMaterial = i == 0 ?
				new THREE.SpriteMaterial({ map: this._textureList[2], transparent: true }):
				new THREE.SpriteMaterial({ map: this._textureList[1], transparent: true });
			const widgetSprite = new THREE.Sprite(widgetMaterial);
			widgetSprite.position.set(

				-(this._widgetSize * 4) + (i * this._widgetSize),
				(this._height / - 2) + (this._height / 12),
				i == 0 ? 0 : -1
			);
			if (i == 0) {

				// 1番目を選択状態に設定
				widgetSprite.scale.set(

					this._widgetSize + (this._widgetSize / 10),
					this._widgetSize + (this._widgetSize / 10),
					1
				);

				// ウィジェットの選択位置を初期化
				this._widgetChoose = 0;

			} else {

				// それ以外は非選択状態に設定
				widgetSprite.scale.set(

					this._widgetSize,
					this._widgetSize,
					1
				);
			}
			scene2d.add(widgetSprite);

			// ウィジェット配列に保存
			this._widgetList.push(widgetSprite);


			// ウィジェットストアを初期化
			const item = palette.find((v) => v.id === this._widgetItemList[i]);

			// ウィジェットストアを作成
			const widgetStoreMaterial = new THREE.MeshBasicMaterial({

				map: this._textureList[3],
				transparent: true
			});
			const widgetStoreMesh = new THREE.Mesh(this._createStoreGeometry(item), widgetStoreMaterial);
			widgetStoreMesh.position.set(

				-(this._widgetSize * 4) + (i * this._widgetSize),
				(this._height / - 2) + (this._height / 12),
				0
			);
			widgetStoreMesh.scale.set(

				this._widgetSize - (this._widgetSize / 4),
				this._widgetSize - (this._widgetSize / 4),
				1
			);
			scene2d.add(widgetStoreMesh);

			// ウィジェットストア配列に保存
			this._widgetStoreList.push(widgetStoreMesh);
		}

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
		let intersects = this._raycaster.intersectObjects(this._widgetList);
		this._hoverWidget = false;
		this._widgetList.map(sprite => {

			if (intersects.length > 0 && sprite === intersects[0].object) {

				// ウィジェットの選択予定位置を更新する
				this._widgetEstimateChoose = sprite.id;

				// 2D 側でオブジェクトを得たことを通知する
				this._hoverWidget = true;
			}
		});

		intersects = this._raycaster.intersectObjects(this._widgetStoreList);
		this._widgetStoreID = 0;
		this._widgetStoreList.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object) {

				// メッシュ ID を取得
				this._widgetStoreID = mesh.id;

				// 2D 側でオブジェクトを得たことを通知する
				this._hoverWidget = true;
			}
		});

		// interface.ts に通知する
		return this._hoverWidget;
	}

	/**
	 * マウスイベント（クリック押下）
	 * @param {object} event: イベント情報
	 * @param {string} itemID: アイテム ID
	 */
	public _mousedown(event, itemID: string) {

		// ウィジェットにマウスカーソルがあるとき
		if (this._hoverWidget) {

			// 左クリックの場合
			if (event.button == 0) {

				for (let i = 0; i < this._widgetList.length; i++) {

					if (this._widgetEstimateChoose == this._widgetList[i].id) {

						// 選択状態にする
						this._widgetList[i].position.z = 0;
						this._widgetList[i].scale.x = this._widgetSize + (this._widgetSize / 10);
						this._widgetList[i].scale.y = this._widgetSize + (this._widgetSize / 10);
						this._widgetList[i].material.map = this._textureList[2];

						// 選択位置を記憶
						this._widgetChoose = i;

						// 選択したウィジェットのアイテム ID を返す
						itemID = this._widgetItemList[i];

					} else {

						// それ以外は非選択状態にする
						this._widgetList[i].position.z = -1;
						this._widgetList[i].scale.x = this._widgetSize;
						this._widgetList[i].scale.y = this._widgetSize;
						this._widgetList[i].material.map = i == 0 ? this._textureList[0] : this._textureList[1];
					}
				}

			// 右クリックの場合
			} else if (event.button == 2) {

				for (let i = 0; i < this._widgetList.length; i++) {

					if (this._widgetEstimateChoose == this._widgetList[i].id) {

						// 削除（空気に変更）する
						this._widgetStoreList[i].geometry = this._createStoreGeometry(palette[0]);

						// ウィジェットストアのアイテム ID リストを更新
						this._widgetItemList[i] = palette[0].id;

						// そのウィジェットが選択中ならアイテム ID を返す
						if (this._widgetChoose == i) {

							itemID = palette[0].id;
						}
					}
				}
			}
		}

		// interface.ts に現在のアイテム ID を通知する
		return itemID;
	}

	/**
	 * マウスイベント（クリック開放）
	 * @param {string} itemID: アイテム ID
	 * @param {string} dragItemID: ドラッグ中のアイテム ID
	 */
	public _mouseup(itemID: string, dragItemID: string) {

		for (let i = 0; i < this._widgetStoreList.length; i++) {

			// ウィジェットストアにドロップされたとき
			if (this._widgetStoreID == this._widgetStoreList[i].id) {

				const item = palette.find((v) => v.id === dragItemID);

				// 新しいジオメトリを上書きしてテクスチャの表示を変更する
				this._widgetStoreList[i].geometry = this._createStoreGeometry(item);

				// ウィジェットストアのアイテム ID リストを更新
				this._widgetItemList[i] = dragItemID;

				// そのウィジェットが選択中ならアイテム ID を返す
				if (this._widgetChoose == i) {

					itemID = item.id;
				}
			}
		}

		// interface.ts に現在のアイテム ID を通知する
		return itemID;
	}

	/**
	 * ウィジェットストアジオメトリの作成
	 * @param {object} item: アイテムオブジェクト
	 */
	private _createStoreGeometry(item) {

		const widgetStoreGeometry = new THREE.PlaneGeometry();
		widgetStoreGeometry.faces.forEach (face => { face.materialIndex = 0 });

		const tex = {

			// パレットサイズ 576x8000
			resolution: { width: 64 * 9, height: 64 * 125 },
			uv: { x: 64 * (parseInt(item.x) - 1), y: 64 * (parseInt(item.y) - 1), w: 64, h: 64 }
		}

		const rect = {

			// テクスチャを反転
			left:   tex.uv.x / tex.resolution.width,
			top:    1 - tex.uv.y / tex.resolution.height,
			right:  (tex.uv.x + tex.uv.w) / tex.resolution.width,
			bottom: 1 - (tex.uv.y + tex.uv.h) / tex.resolution.height
		}

		widgetStoreGeometry.faceVertexUvs[0][0] = [

			new THREE.Vector2(rect.left, rect.top),
			new THREE.Vector2(rect.left, rect.bottom),
			new THREE.Vector2(rect.right, rect.top)
		];
		widgetStoreGeometry.faceVertexUvs[0][1] = [

			new THREE.Vector2(rect.left, rect.bottom),
			new THREE.Vector2(rect.right, rect.bottom),
			new THREE.Vector2(rect.right, rect.top)
		];

		return widgetStoreGeometry;
	}
}
