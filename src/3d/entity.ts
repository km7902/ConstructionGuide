import palette from '../palette';
import Texturemap from './texturemap';
import * as THREE from 'three';

/**
 * エンティティクラス
 */
export default class Entity {

	/* 外部リソースへの URL */
	private readonly _baseURL;

	/* ブロックサイズと数 */
	private _blockSize: number;
	private _blockStep: number;

	/* エンティティの配置 */
	private _entitySpace;

	/* テクスチャマップオブジェクト */
	private readonly _texturemap: Texturemap;

	/* エンティティ制御オブジェクト */
	private _entityControl: THREE.Mesh[];

	/* エンティティメッシュ ID */
	private _entityMeshID: number;

	/* エンティティアイテム ID */
	private _entityItemID: string;

	/* 公開: デバッグ表示 */
	public _getEntityItemID() {

		let jeid = '';
		if (this._entityItemID != '0')
			jeid = palette.find((v) => v.id === this._entityItemID).jeid;
		return jeid;
	}

	/* エンティティ集合オブジェクト */
	private readonly _entityGroup: THREE.Group;

	/* 公開: main.ts で 3D シーンに登録してもらうため */
	public _setEntityGroup(mesh) {

		// mesh { entity: ターゲットエンティティ, action: 処理内容 }

		switch (mesh.action) {

			case 'add': // 登録の場合
				this._entityGroup.add(mesh.entity);
				break;

			case 'remove': // 削除の場合
				this._entityGroup.remove(mesh.entity);
				break;

			default: // それ以外は何もしない
				break;
		}
	}

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene: 3D シーンオブジェクト
	 * @param {string} baseURL: 外部リソースへの URL
	 * @param {number} blockSize: ブロックのサイズ
	 * @param {number} blockSize: ブロックの数
	 */
	constructor(scene: THREE.Scene, baseURL: string, blockSize: number, blockStep: number) {

		// ベース URL を設定
		this._baseURL = baseURL;

		// ブロックサイズと数を取得
		this._blockSize = blockSize;
		this._blockStep = blockStep;

		// エンティティの配置を初期化
		this._entitySpace = { '63': { '0': { '0': '0' } } };

		// テクスチャマップを作成する
		this._texturemap = new Texturemap();

		// エンティティ集合を作成する
		this._entityGroup = new THREE.Group();
		scene.add(this._entityGroup);

		// マウスとの交差を調べたいものはエンティティ制御に格納する
		this._entityControl = [];

		// レイキャストを作成
		this._raycaster = new THREE.Raycaster();
	}

	/**
	 * フレーム毎の更新
	 * @param {THREE.Vector2} mouseUV: マウスカーソル座標
	 * @param {THREE.PerspectiveCamera} camera: 3D カメラオブジェクト
	 * @param {boolean} action: 2D 側イベントの有無
	 */
	public _update(mouseUV: THREE.Vector2, camera: THREE.PerspectiveCamera, action: boolean) {

		// マウス位置からまっすぐに伸びる光線ベクトルを生成
		this._raycaster.setFromCamera(mouseUV, camera);

		// その光線とぶつかったオブジェクトを得る
		let intersects = this._raycaster.intersectObjects(this._entityControl);
		this._entityMeshID = 0;
		this._entityItemID = '0';
		this._entityControl.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object && !action) {

				// 2D 側イベントがない場合、対象をハイライト状態にする
				(<any>mesh.material).color.r = 1;
				(<any>mesh.material).color.g = 1;
				(<any>mesh.material).color.b = 1;

				// エンティティ ID を取得
				this._entityMeshID = mesh.id;

				// アイテム ID を取得
				this._entityItemID = mesh.name;

			} else {

				// その他は非ハイライト状態にする
				(<any>mesh.material).color.r = 0.8;
				(<any>mesh.material).color.g = 0.8;
				(<any>mesh.material).color.b = 0.8;
			}
		});
	}

	/**
	 * マウスイベント（クリック押下）
	 * @param {object} event: イベント情報
	 * @param {string} itemID: アイテム ID
	 * @param {THREE.Vector3} position: エンティティの登録位置
	 */
	public _mousedown(event, itemID: string, position: THREE.Vector3) {

		// 左クリックの場合
		if (event.button == 0) {

			// エンティティの登録位置
			const posX = position.x;
			const posY = (position.y - 63) * this._blockSize + (this._blockSize / 2);
			const posZ = position.z;

			// エンティティがすでに配置されているかチェックする
			if (!this._entitySpaceExist(posX, posY, posZ)) {

				// キャンセルを main.ts に返す
				return { entity: null, action: 'cancel' }
			}

			// 持っているアイテムによってテクスチャを切り替える
			const item = palette.find((v) => v.id === itemID);

			// エンティティを作成
			const entityGeometry = new THREE.BoxGeometry(

				this._blockSize,
				this._blockSize,
				this._blockSize
			);
			let entityMaterial;
			switch (item.tex) {

				// 単調テクスチャ
				case 'toBox':
					entityMaterial = new THREE.MeshPhongMaterial({

						color: 0xcccccc,
						map: this._texturemap.toBox(this._baseURL + 'texture/' + item.en.replace(/ /g, '_') + '.png'),
						transparent: true
					});
					break;

				// 天地無用テクスチャ
				case 'toTopBox':
					entityMaterial = new THREE.MeshPhongMaterial({

						color: 0xcccccc,
						map: this._texturemap.toTopBox(entityGeometry, this._baseURL + 'texture/' + item.en.replace(/ /g, '_') + '.png'),
						transparent: true
					});
					break;
			}

			const entityMesh = new THREE.Mesh(entityGeometry, entityMaterial);
			entityMesh.position.set(posX, posY, posZ);

			// アイテム ID を持たせる
			entityMesh.name = item.id;

			// エンティティ制御に追加
			this._entityControl.push(entityMesh);

			// エンティティの配置に登録
			this._entitySpaceAdd(entityMesh);

			// エンティティを main.ts に渡す
			return { entity: entityMesh, action: 'add' }

		// 右クリックの場合
		} else if (event.button == 2) {

			for (let i = 0; i < this._entityControl.length; i++) {

				if (this._entityMeshID == this._entityControl[i].id) {

					// エンティティ集合から削除するために一時保管
					const entityMesh = this._entityControl[i];

					// エンティティの配置から削除
					this._entitySpaceRemove(entityMesh);

					// エンティティ制御から削除
					this._entityControl.splice(i, 1);

					// エンティティを main.ts に渡す
					return { entity: entityMesh, action: 'remove' }
				}
			}

			// キャンセルを main.ts に返す
			return { entity: null, action: 'cancel' }
		}
	}

	/**
	 * エンティティの配置マネージャ（検査）
	 * @param {number} posX: ブロックの X 座標
	 * @param {number} posY: ブロックの Y 座標
	 * @param {number} posZ: ブロックの Z 座標
	 */
	public _entitySpaceExist(posX: number, posY: number, posZ: number) {

		// 空間座標を取得
		const x = this._getX(posX);
		const y = this._getY(posY);
		const z = this._getZ(posZ);

		// エンティティの配置に存在しなければ登録可能
		let exist = false;
		Object.keys(this._entitySpace).map(e1 => {if (e1 == y) exist = true});
		if (!exist) return true;
		exist = false;
		Object.keys(this._entitySpace[y]).map(e2 => {if (e2 == x) exist = true});
		if (!exist) return true;
		exist = false;
		Object.keys(this._entitySpace[y][x]).map(e3 => {if (e3 == z) exist = true});
		if (!exist) return true;

		// すでに何かある場合は登録不可（ただし Air: 0 のときは例外）
		if (this._entitySpace[y][x][z] != '0')
			return false;
		else
			return true;
	}

	/**
	 * エンティティの配置マネージャ（登録）
	 * @param {THREE.Mesh} mesh: エンティティオブジェクト
	 */
	public _entitySpaceAdd(mesh: THREE.Mesh) {

		// 空間座標を取得
		const x = this._getX(mesh.position.x);
		const y = this._getY(mesh.position.y);
		const z = this._getZ(mesh.position.z);

		// エンティティの配置に登録
		let exist = false;
		Object.keys(this._entitySpace).map(e1 => {if (e1 == y) exist = true});
		if (!exist) this._entitySpace[y] = {};
		exist = false;
		Object.keys(this._entitySpace[y]).map(e2 => {if (e2 == x) exist = true});
		if (!exist) this._entitySpace[y][x] = {};
		this._entitySpace[y][x][z] = mesh.name;

		// インターフェースができるまではコンソールログに JSON データを出力する
		console.log(JSON.stringify(this._entitySpace));
	}

	/**
	 * エンティティの配置マネージャ（削除）
	 * @param {THREE.Mesh} mesh: ブロックオブジェクト
	 */
	public _entitySpaceRemove(mesh: THREE.Mesh) {

		// 空間座標を取得
		const x = this._getX(mesh.position.x);
		const y = this._getY(mesh.position.y);
		const z = this._getZ(mesh.position.z);

		// エンティティの配置から削除（Air: 0 にする）
		let exist = false;
		Object.keys(this._entitySpace).map(e1 => {if (e1 == y) exist = true});
		if (!exist) this._entitySpace[y] = {};
		exist = false;
		Object.keys(this._entitySpace[y]).map(e2 => {if (e2 == x) exist = true});
		if (!exist) this._entitySpace[y][x] = {};
		this._entitySpace[y][x][z] = '0';
	}

	/**
	 * x 空間座標を取得
	 * @param {number} x: ブロックの X 座標
	 */
	private _getX(x: number) {

		if (x % this._blockSize == 0)
			return String(x / this._blockSize);
		else
			return String((x - this._blockSize / 2) / this._blockSize);
	}

	/**
	 * y 空間座標を取得
	 * @param {number} y: ブロックの Y 座標
	 */
	private _getY(y: number) {

		return String((y - this._blockSize / 2) / this._blockSize + 63);
	}

	/**
	 * z 空間座標を取得
	 * @param {number} z: ブロックの Z 座標
	 */
	private _getZ(z: number) {

		if (z % this._blockSize == 0)
			return String(z / this._blockSize);
		else
			return String((z - this._blockSize / 2) / this._blockSize);
	}

	/**
	 * エンティティの配置を復元
	 * @param {string} json: JSON 文字列
	 */
	public _entitySpaceRecover(json: string) {

		// エンティティの配置を読み込む
		this._entitySpace = JSON.parse(json);

		// エンティティの配置を復元
		Object.keys(this._entitySpace).map(e1 =>
			Object.keys(this._entitySpace[e1]).map(e2 =>
				Object.keys(this._entitySpace[e1][e2]).map(e3 => {

					if (this._entitySpace[e1][e2][e3] != 0) {

						const posX = this._setX(e2);
						const posY = this._setY(e1);
						const posZ = this._setZ(e3);

						// 持っているアイテムによってテクスチャを切り替える
						const item = palette.find((v) => v.id === this._entitySpace[e1][e2][e3]);

						// エンティティを作成
						const entityGeometry = new THREE.BoxGeometry(

							this._blockSize,
							this._blockSize,
							this._blockSize
						);
						let entityMaterial;
						switch (item.tex) {

							// 単調テクスチャ
							case 'toBox':
								entityMaterial = new THREE.MeshPhongMaterial({

									color: 0xcccccc,
									map: this._texturemap.toBox(this._baseURL + 'texture/' + item.en.replace(/ /g, '_') + '.png'),
									transparent: true
								});
								break;

							// 天地無用テクスチャ
							case 'toTopBox':
								entityMaterial = new THREE.MeshPhongMaterial({

									color: 0xcccccc,
									map: this._texturemap.toTopBox(entityGeometry, this._baseURL + 'texture/' + item.en.replace(/ /g, '_') + '.png'),
									transparent: true
								});
								break;
						}

						const entityMesh = new THREE.Mesh(entityGeometry, entityMaterial);
						entityMesh.position.set(posX, posY, posZ);

						// アイテム ID を持たせる
						entityMesh.name = item.id;

						// エンティティ制御に追加
						this._entityControl.push(entityMesh);

						// エンティティ集合に登録
						this._entityGroup.add(entityMesh);
					}
				})
			)
		);
	}

	/**
	 * x ブロック座標を算出
	 * @param {string} x: X 空間座標
	 */
	private _setX(x: string) {

		return parseInt(x) * this._blockSize + (this._blockStep % 2 == 0 ? this._blockSize / 2 : 0);
	}

	/**
	 * y ブロック座標を算出
	 * @param {string} y: Y 空間座標
	 */
	private _setY(y: string) {

		return (parseInt(y) - 63) * this._blockSize + (this._blockSize / 2);
	}

	/**
	 * z ブロック座標を算出
	 * @param {string} z: Z 空間座標
	 */
	private _setZ(z: string) {

		return parseInt(z) * this._blockSize + (this._blockStep % 2 == 0 ? this._blockSize / 2 : 0);
	}

	/**
	 * エンティティ集合の高度を設定
	 * @param {number} level: 高度
	 */
	public _setLevel(level: number) {

		this._entityGroup.position.y = -(level - 63) * this._blockSize;
	}
}
