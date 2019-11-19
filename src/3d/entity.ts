import palette from '../palette';
import Texturemap from './texturemap';
import * as THREE from 'three';

/**
 * エンティティクラス
 */
export default class Entity {

	/* ベースとなる URL */
	private readonly _baseURL;

	/* ブロックサイズと数 */
	private _blockSize: number;
	private _blockStep: number;

	/* エンティティブロック空間配列 */
	private _blockSpace;

	/* テクスチャマップオブジェクト */
	private readonly _texturemap: Texturemap;

	/* エンティティ配列オブジェクト */
	private _entityList: THREE.Mesh[];
	private _entityID: number;
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

		// mesh { entity: 対象のエンティティ, action: 処理内容 }

		switch (mesh.action) {

			case 'add':
				this._entityGroup.add(mesh.entity); // 登録の場合
				break;

			case 'remove':
				this._entityGroup.remove(mesh.entity); // 削除の場合
				break;

			default:
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
	 * @param {number} blockSize: エンティティブロックサイズ
	 * @param {number} blockSize: エンティティブロックの数
	 */
	constructor(scene: THREE.Scene, baseURL: string, blockSize: number, blockStep: number) {

		// ベース URL を設定
		this._baseURL = baseURL;

		// エンティティブロックサイズと数を取得
		this._blockSize = blockSize;
		this._blockStep = blockStep;

		// エンティティブロック空間を初期化
		this._blockSpace = { '63': { '0': { '0': '0' } } };

		// テクスチャマップを作成する
		this._texturemap = new Texturemap();

		// エンティティ集合を作成する
		this._entityGroup = new THREE.Group();
		scene.add(this._entityGroup);

		// マウスとの交差を調べたいものは配列に格納する
		this._entityList = [];

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
		let intersects = this._raycaster.intersectObjects(this._entityList);
		this._entityItemID = '0';
		this._entityList.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object && !action) {

				// 2D 側イベントがない場合、対象をハイライト状態にする
				(<any>mesh.material).color.r = 1;
				(<any>mesh.material).color.g = 1;
				(<any>mesh.material).color.b = 1;

				// エンティティ ID を取得
				this._entityID = mesh.id;

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
			if (!this._blockSpaceCheck(posX, posY, posZ)) {

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

			// アイテム ID を記憶させる
			entityMesh.name = item.id;

			// エンティティ配列に保存
			this._entityList.push(entityMesh);

			// エンティティブロック空間配列に登録
			this._blockSpaceAdd(entityMesh);

			// エンティティを main.ts に渡す
			return { entity: entityMesh, action: 'add' }

		// 右クリックの場合
		} else if (event.button == 2) {

			for (let i = 0; i < this._entityList.length; i++) {

				if (this._entityID == this._entityList[i].id) {

					// エンティティ集合を削除するために一時保管
					const entityMesh = this._entityList[i];

					// エンティティブロック空間配列から削除
					this._blockSpaceRemove(entityMesh);

					// エンティティ配列から削除
					this._entityList.splice(i, 1);

					// エンティティを main.ts に渡す
					return { entity: entityMesh, action: 'remove' }
				}
			}
		} 
	}

	/**
	 * エンティティブロック空間マネージャ（登録前の検査）
	 * @param {number} posX: ブロックの X 座標
	 * @param {number} posY: ブロックの Y 座標
	 * @param {number} posZ: ブロックの Z 座標
	 */
	public _blockSpaceCheck(posX: number, posY: number, posZ: number) {

		// ブロック座標を取得
		const x = this._getX(posX);
		const y = this._getY(posY);
		const z = this._getZ(posZ);

		// エンティティブロック空間配列の要素が存在しなければ登録可能
		let exist = false;
		Object.keys(this._blockSpace).map(e1 => {if (e1 == y) exist = true});
		if (!exist) return true;
		exist = false;
		Object.keys(this._blockSpace[y]).map(e2 => {if (e2 == x) exist = true});
		if (!exist) return true;
		exist = false;
		Object.keys(this._blockSpace[y][x]).map(e3 => {if (e3 == z) exist = true});
		if (!exist) return true;

		// すでに何かある場合は登録不可（Air: 0 のときは例外）
		if (this._blockSpace[y][x][z] != '0')
			return false;
		else
			return true;
	}

	/**
	 * エンティティブロック空間マネージャ（登録）
	 * @param {THREE.Mesh} mesh: ブロックオブジェクト
	 */
	public _blockSpaceAdd(mesh: THREE.Mesh) {

		// ブロック座標を取得
		const x = this._getX(mesh.position.x);
		const y = this._getY(mesh.position.y);
		const z = this._getZ(mesh.position.z);

		// エンティティブロック空間配列に記録
		let exist = false;
		Object.keys(this._blockSpace).map(e1 => {if (e1 == y) exist = true});
		if (!exist) this._blockSpace[y] = {};
		exist = false;
		Object.keys(this._blockSpace[y]).map(e2 => {if (e2 == x) exist = true});
		if (!exist) this._blockSpace[y][x] = {};
		this._blockSpace[y][x][z] = mesh.name;

		// インターフェースができるまではコンソールログに JSON データを出力する
		console.log(JSON.stringify(this._blockSpace));
	}

	/**
	 * エンティティブロック空間マネージャ（削除）
	 * @param {THREE.Mesh} mesh: ブロックオブジェクト
	 */
	public _blockSpaceRemove(mesh: THREE.Mesh) {

		// ブロック座標を取得
		const x = this._getX(mesh.position.x);
		const y = this._getY(mesh.position.y);
		const z = this._getZ(mesh.position.z);

		// エンティティブロック空間配列から削除（Air: 0 にする）
		let exist = false;
		Object.keys(this._blockSpace).map(e1 => {if (e1 == y) exist = true});
		if (!exist) this._blockSpace[y] = {};
		exist = false;
		Object.keys(this._blockSpace[y]).map(e2 => {if (e2 == x) exist = true});
		if (!exist) this._blockSpace[y][x] = {};
		this._blockSpace[y][x][z] = '0';
	}

	/**
	 * x ブロック座標を取得
	 * @param {number} x: 3D 空間座標
	 */
	private _getX(x: number) {

		if (x % this._blockSize == 0)
			return String(x / this._blockSize);
		else
			return String((x - this._blockSize / 2) / this._blockSize);
	}

	/**
	 * y ブロック座標を取得
	 * @param {number} y: 3D 空間座標
	 */
	private _getY(y: number) {

		return String((y - this._blockSize / 2) / this._blockSize + 63);
	}

	/**
	 * z ブロック座標を取得
	 * @param {number} z: 3D 空間座標
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
	public _recover(json: string) {

		// エンティティブロック空間配列に復元
		this._blockSpace = JSON.parse(json);

		// エンティティの配置を復元
		Object.keys(this._blockSpace).map(e1 =>
			Object.keys(this._blockSpace[e1]).map(e2 =>
				Object.keys(this._blockSpace[e1][e2]).map(e3 => {

					const posX = this._setX(e2);
					const posY = this._setY(e1);
					const posZ = this._setZ(e3);

					// 持っているアイテムによってテクスチャを切り替える
					const item = palette.find((v) => v.id === this._blockSpace[e1][e2][e3]);

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

					// アイテム ID を記憶させる
					entityMesh.name = item.id;

					// エンティティ配列に保存
					this._entityList.push(entityMesh);

					// エンティティ集合に保存
					this._entityGroup.add(entityMesh);
				})
			)
		);
	}

	/**
	 * x 空間座標を設定
	 * @param {string} x: 3D ブロック座標
	 */
	private _setX(x: string) {

		return parseInt(x) * this._blockSize + (this._blockStep % 2 == 0 ? this._blockSize / 2 : 0);
	}

	/**
	 * y 空間座標を設定
	 * @param {string} y: 3D ブロック座標
	 */
	private _setY(y: string) {

		return (parseInt(y) - 63) * this._blockSize + (this._blockSize / 2);
	}

	/**
	 * z 空間座標を設定
	 * @param {string} z: 3D ブロック座標
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
