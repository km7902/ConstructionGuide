import palette from '../palette';
import * as THREE from 'three';

/**
 * インベントリクラス
 */
export default class Inventory {

	/* キャンバスオブジェクト */
	private readonly _canvas;
	private _width: number;
	private _height: number;

	/* テクスチャ配列オブジェクト */
	private _textureList: THREE.Texture[];

	/* インベントリ配列オブジェクト */
	private _inventoryList1: THREE.Sprite[]; // 常に表示
	private _inventoryList2: THREE.Sprite[]; // 表示・非表示

	/* インベントリストア配列オブジェクト */
	private _inventoryStoreList: THREE.Mesh[];

	/* インベントリ集合 */
	private _inventoryGroup: THREE.Group;

	/* 公開: インベントリ集合の表示・非表示を確認する */
	public _getInventoryGroup() {

		return this._inventoryGroup;
	}

	/* インベントリに表示されたアイテム ID */
	private _inventoryItemChoose: string;

	/* 公開:デバッグ表示 */
	public _getInventoryItemChoose() {

		// Minecraft JavaEdition の ID を返す
		let jeid = '';
		if (this._inventoryItemChoose != '0')
			jeid = palette.find((v) => v.id === this._inventoryItemChoose).jeid;
		return jeid;
	}

	/* インベントリストアのアイテム ID */
	private _inventoryItemList: string[];
	private _inventoryItemCursor: number; // 何番目のアイテムが表示中か（ページ送りに必要）

	/* ボタンの押下予定位置 */
	private _inventoryBtnEstimateChoose: number;

	/* マウス操作 */
	private _hoverInventory1: boolean;
	private _hoverInventory2: boolean;
	private _hoverInventoryStore: boolean;

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene2d: 2D シーンオブジェクト
	 * @param {number} widgetSize: ウィジェットの幅と高さ
	 */
	constructor(scene2d: THREE.Scene, widgetSize: number) {

		// キャンバスを取得
		this._canvas = document.getElementById('app');
		this._width = this._canvas.clientWidth;
		this._height = this._canvas.clientHeight;

		// テクスチャを読み込む
		this._textureList = [];

		// チェストテクスチャ
		this._textureList.push(new THREE.TextureLoader().load('img/chest.png'));
		this._textureList[0].magFilter = THREE.NearestFilter;
		this._textureList[0].minFilter = THREE.NearestFilter;
		this._textureList[0].type = THREE.FloatType;

		// インベントリテクスチャ
		this._textureList.push(new THREE.TextureLoader().load('img/inventory_bg.png'));
		this._textureList[1].magFilter = THREE.NearestFilter;
		this._textureList[1].minFilter = THREE.NearestFilter;
		this._textureList[1].type = THREE.FloatType;

		this._textureList.push(new THREE.TextureLoader().load('img/inventory.png'));
		this._textureList[2].magFilter = THREE.NearestFilter;
		this._textureList[2].minFilter = THREE.NearestFilter;
		this._textureList[2].type = THREE.FloatType;

		// インベントリストアテクスチャ
		this._textureList.push(new THREE.TextureLoader().load('img/palette.png'));
		this._textureList[3].magFilter = THREE.LinearFilter;
		this._textureList[3].minFilter = THREE.LinearFilter;
		this._textureList[3].type = THREE.FloatType;

		// ナビゲーションテクスチャ
		this._textureList.push(new THREE.TextureLoader().load('img/nav_back.png'));
		this._textureList[4].magFilter = THREE.NearestFilter;
		this._textureList[4].minFilter = THREE.NearestFilter;
		this._textureList[4].type = THREE.FloatType;

		this._textureList.push(new THREE.TextureLoader().load('img/nav_next.png'));
		this._textureList[5].magFilter = THREE.NearestFilter;
		this._textureList[5].minFilter = THREE.NearestFilter;
		this._textureList[5].type = THREE.FloatType;

		// マウスとの交差を調べたいものは配列に格納する
		this._inventoryList1 = [];
		this._inventoryList2 = [];
		this._inventoryStoreList = [];

		// チェストボタンを作成
		const chestSprite = new THREE.Sprite(

			new THREE.SpriteMaterial({ map: this._textureList[0], transparent: true })
		);
		chestSprite.position.set(this._width / 2.2, (this._height / - 2) + (this._height / 12), 0);
		chestSprite.scale.set(this._width / 20, this._width / 20, 1);
		scene2d.add(chestSprite);

		// インベントリ配列に保存
		this._inventoryList1.push(chestSprite);


		// インベントリ集合を作成する
		this._inventoryGroup = new THREE.Group();
		scene2d.add(this._inventoryGroup);

		// パレットから有効なアイテムを検索（x, y が設定されているもの）
		this._inventoryItemCursor = 0;
		this._inventoryItemList = [];
		for (let i = 0; i < palette.length; i++) {

			if (palette[i].x != '' && palette[i].y != '' && palette[i].id != '0')
				this._inventoryItemList.push(palette[i].id);
		}

		// インベントリの選択を初期化
		this._inventoryItemChoose = '0';

		for (let i = 0; i < 3; i++) {

			for (let j = 0; j < 3; j++) {

				// インベントリの背景を作成
				const planeGeometry = new THREE.PlaneGeometry();
				planeGeometry.faces.forEach (face => { face.materialIndex = 0 });

				const tex = {

					// パレットサイズ 32x32
					resolution: { width: 32, height: 32 },
					uv: { x: i * 8, y: 16 - j * 8, w: 16, h: 16 }
				}

				const rect = {

					// テクスチャを反転
					left:   tex.uv.x / tex.resolution.width,
					top:    1 - tex.uv.y / tex.resolution.height,
					right:  (tex.uv.x + tex.uv.w) / tex.resolution.width,
					bottom: 1 - (tex.uv.y + tex.uv.h) / tex.resolution.height
				}

				planeGeometry.faceVertexUvs[0][0] = [

					new THREE.Vector2(rect.left, rect.top),
					new THREE.Vector2(rect.left, rect.bottom),
					new THREE.Vector2(rect.right, rect.top)
				];
				planeGeometry.faceVertexUvs[0][1] = [

					new THREE.Vector2(rect.left, rect.bottom),
					new THREE.Vector2(rect.right, rect.bottom),
					new THREE.Vector2(rect.right, rect.top)
				];

				const planeMaterial = new THREE.MeshBasicMaterial({

					map: this._textureList[1],
					transparent: true
				});
				const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
				planeMesh.position.set(

					((i * widgetSize) * 4.5)  - (4.5 * widgetSize),
					((j * widgetSize) * 2.75) - (2.5 * widgetSize),
					-1
				);
				planeMesh.scale.set(

					i != 1 ? widgetSize : (i * widgetSize) * 9,
					j != 1 ? widgetSize : (j * widgetSize) * 6,
					1
				);

				// インベントリ集合に保存
				this._inventoryGroup.add(planeMesh);
			}
		}

		for (let i = 0; i < 5; i++) {

			for (let j = 0; j < 9; j++) {

				// インベントリを作成
				const spriteMaterial = new THREE.SpriteMaterial({

					map: this._textureList[2],
					transparent: true
				});
				const sprite = new THREE.Sprite(spriteMaterial);
				sprite.position.set(

					-(widgetSize * 4) + (j * widgetSize),
					-(widgetSize * (i - 5)) - (2.5 * widgetSize),
					-1
				);
				sprite.scale.set(

					widgetSize,
					widgetSize,
					1
				);

				// インベントリ集合に保存
				this._inventoryGroup.add(sprite);

				// インベントリストアの内容を初期化
				let item = palette.find((v) => v.id === this._inventoryItemList[this._inventoryItemCursor]);
				if (this._inventoryItemCursor < this._inventoryItemList.length)
					this._inventoryItemCursor++;
				else
					item = palette[0];

				// インベントリストアを作成
				const planeGeometry = new THREE.PlaneGeometry();
				planeGeometry.faces.forEach (face => { face.materialIndex = 0 });

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

				planeGeometry.faceVertexUvs[0][0] = [

					new THREE.Vector2(rect.left, rect.top),
					new THREE.Vector2(rect.left, rect.bottom),
					new THREE.Vector2(rect.right, rect.top)
				];
				planeGeometry.faceVertexUvs[0][1] = [

					new THREE.Vector2(rect.left, rect.bottom),
					new THREE.Vector2(rect.right, rect.bottom),
					new THREE.Vector2(rect.right, rect.top)
				];

				const planeMaterial = new THREE.MeshBasicMaterial({

					map: this._textureList[3],
					transparent: true
				});
				const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
				planeMesh.position.set(

					-(widgetSize * 4) + (j * widgetSize),
					-(widgetSize * (i - 5)) - (2.5 * widgetSize),
					0
				);
				planeMesh.scale.set(
					widgetSize - (widgetSize / 4),
					widgetSize - (widgetSize / 4),
					1
				);
				planeMesh.name = item.id;

				// インベントリ集合に保存
				this._inventoryGroup.add(planeMesh);

				// インベントリストア配列に保存
				this._inventoryStoreList.push(planeMesh);
			}
		}

		// 戻るボタンを作成
		const navBackMaterial = new THREE.SpriteMaterial({

			map: this._textureList[4],
			transparent: true
		});
		const navBackSprite = new THREE.Sprite(navBackMaterial);
		navBackSprite.position.set(

			-(widgetSize * 4) + (7.5 * widgetSize),
			-(widgetSize * 2.4),
			-1
		);
		navBackSprite.scale.set(widgetSize / 3, widgetSize / 2, 1);

		// インベントリ配列に保存
		this._inventoryList2.push(navBackSprite);

		// インベントリ集合に保存
		this._inventoryGroup.add(navBackSprite);

		// 進むボタンを作成
		const navNextMaterial = new THREE.SpriteMaterial({

			map: this._textureList[5],
			transparent: true
		});
		const navNextSprite = new THREE.Sprite(navNextMaterial);
		navNextSprite.position.set(

			-(widgetSize * 4) + (8.25 * widgetSize),
			-(widgetSize * 2.4),
			-1
		);
		navNextSprite.scale.set(widgetSize / 3, widgetSize / 2, 1);

		// インベントリ配列に保存
		this._inventoryList2.push(navNextSprite);

		// インベントリ集合に保存
		this._inventoryGroup.add(navNextSprite);

		// 初期化時のインベントリ集合を非表示にする
		this._inventoryGroup.visible = false;

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
		let intersects = this._raycaster.intersectObjects(this._inventoryList1);
		this._hoverInventory1 = false;
		this._inventoryList1.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object) {

				// 2D 側でオブジェクトを得たことを通知する
				this._hoverInventory1 = true;
			}
		});

		// インベントリ集合が表示されているとき
		if (this._inventoryGroup.visible) {

			let intersects = this._raycaster.intersectObjects(this._inventoryList2);
			this._hoverInventory2 = false;
			this._inventoryList2.map(mesh => {

				if (intersects.length > 0 && mesh === intersects[0].object) {

					// ボタンの押下予定位置を更新する
					this._inventoryBtnEstimateChoose = mesh.id;

					// 2D 側でオブジェクトを得たことを通知する
					this._hoverInventory2 = true;
				}
			});

			// インベントリストアでもレイキャストを実行
			intersects = this._raycaster.intersectObjects(this._inventoryStoreList);
			this._inventoryItemChoose = '0';
			this._hoverInventoryStore = false;
			this._inventoryStoreList.map(mesh => {

				if (intersects.length > 0 && mesh === intersects[0].object) {

					// アイテム ID を取得
					this._inventoryItemChoose = mesh.name;

					// 2D 側でオブジェクトを得たことを通知する
					this._hoverInventoryStore = true;
				}
			});
		}

		// interface.ts に通知する
		return this._hoverInventory1 || this._hoverInventory2 || this._hoverInventoryStore;
	}

	/**
	 * マウスイベント（クリック押下）
	 * @param {THREE.Vector2} canvasUV: マウスカーソルのキャンバス座標
	 * @param {number} widgetSize: ウィジェットの幅と高さ
	 */
	public _mousedown(canvasUV: THREE.Vector2, widgetSize: number) {

		// チェストにマウスカーソルがあるとき
		if (this._hoverInventory1) {

			// インベントリ集合の表示・非表示を切り替える
			this._inventoryGroup.visible = this._inventoryGroup.visible ? false : true;
		}

		// 戻る・進むボタンにカーソルがあるとき
		if (this._hoverInventory2) {

			// 戻るボタン
			if (this._inventoryBtnEstimateChoose == this._inventoryList2[0].id) {

				// 2ページ前に遡ってから次のページを表示する
				if (this._inventoryItemCursor >= 5 * 9 * 2)
					this._inventoryItemCursor -= 5 * 9 * 2;
				else
					return;
			}

			// 次のページがなければ以降を処理しない
			if (this._inventoryItemCursor >= this._inventoryItemList.length) return;

			// 次のページを表示する
			let counter = 0;
			for (let i = 0; i < 5; i++) {

				for (let j = 0; j < 9; j++) {

					// 表示するものがなければ「空気」にする
					let item = palette.find((v) => v.id === this._inventoryItemList[this._inventoryItemCursor]);
					this._inventoryItemCursor++;
					if (this._inventoryItemCursor > this._inventoryItemList.length)
						item = palette[0];

					const planeGeometry = new THREE.PlaneGeometry();
					planeGeometry.faces.forEach (face => { face.materialIndex = 0 });

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

					planeGeometry.faceVertexUvs[0][0] = [

						new THREE.Vector2(rect.left, rect.top),
						new THREE.Vector2(rect.left, rect.bottom),
						new THREE.Vector2(rect.right, rect.top)
					];
					planeGeometry.faceVertexUvs[0][1] = [

						new THREE.Vector2(rect.left, rect.bottom),
						new THREE.Vector2(rect.right, rect.bottom),
						new THREE.Vector2(rect.right, rect.top)
					];
					this._inventoryStoreList[counter].name = item.id;
					this._inventoryStoreList[counter].geometry = planeGeometry;
					counter++;
				}
			}
		}

		// インベントリストアのアイテムにマウスカーソルがあるとき
		if (this._hoverInventoryStore) {

			// ドラッグ中に表示するアイテムを初期化
			const item = palette.find((v) => v.id === this._inventoryItemChoose);

			// ドラッグ中に表示するアイテムを作成
			const planeGeometry = new THREE.PlaneGeometry();
			planeGeometry.faces.forEach (face => { face.materialIndex = 0 });

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

			planeGeometry.faceVertexUvs[0][0] = [

				new THREE.Vector2(rect.left, rect.top),
				new THREE.Vector2(rect.left, rect.bottom),
				new THREE.Vector2(rect.right, rect.top)
			];
			planeGeometry.faceVertexUvs[0][1] = [

				new THREE.Vector2(rect.left, rect.bottom),
				new THREE.Vector2(rect.right, rect.bottom),
				new THREE.Vector2(rect.right, rect.top)
			];

			const planeMaterial = new THREE.MeshBasicMaterial({

				map: this._textureList[3],
				transparent: true
			});
			const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
			planeMesh.position.set(

				canvasUV.x - (this._width / 2),
				(this._height / 2) - canvasUV.y,
				0
			);
			planeMesh.scale.set(

				widgetSize - (widgetSize / 4),
				widgetSize - (widgetSize / 4),
				1
			);

			// ドラッグ中に表示するアイテムとして登録
			planeMesh.name = this._inventoryItemChoose;

			// ドラッグ中に表示するアイテムを interface.ts に渡す
			return planeMesh;
		}

		// アイテムの選択でなければ null を返す
		return null;
	}
}
