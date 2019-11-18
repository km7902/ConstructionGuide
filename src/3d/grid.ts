import * as THREE from 'three';

/**
 * グリッドクラス
 */
export default class Grid {

	/* ブロックのサイズと数 */
	private _blockSize: number;
	private _blockStep: number;

	/* 公開: エンティティの作成基準 */
	public _getBlockSize() {

		return this._blockSize;
	}

	/* 公開: エンティティの作成基準 */
	public _getBlockStep() {

		return this._blockStep;
	}

	/* グリッドオブジェクト */
	private readonly _gridHelper: THREE.GridHelper;

	/* グリッド集合オブジェクト */
	private readonly _gridGroup: THREE.Group;

	/* グリッド配列オブジェクト */
	private _gridList: THREE.Mesh[];

	/* 選択状態 */
	private _selectMesh: boolean;

	/* 公開: クリックの処理で必要 */
	public _getSelectMesh() {

		return this._selectMesh;
	}

	/* 選択中のマス目の位置 */
	private _selectMeshPos: THREE.Vector3;

	/* 公開: エンティティの作成基準 */
	public _getSelectMeshPos() {

		return this._selectMeshPos;
	}

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene: 3D シーンオブジェクト
	 */
	constructor(scene: THREE.Scene) {

		this._blockSize = 100; // ブロックのサイズ
		this._blockStep = 50;  // ブロックの数

		// グリッドを作成
		this._gridHelper = new THREE.GridHelper(

			this._blockSize * this._blockStep,
			this._blockStep,
			0xffff66,
			0xffffff
		);
		this._gridHelper.position.set(0, 1, 0);
		scene.add(this._gridHelper);

		// グリッド集合を作成する
		this._gridGroup = new THREE.Group();
		scene.add(this._gridGroup);

		// マウスカーソルとの交差を調べたいものは配列に格納する
		this._gridList = [];

		// メッシュを作成してグリッドに合うよう並べる
		for (let i = 0; i < this._blockStep; i++) {

			for (let j = 0; j < this._blockStep; j++) {

				// グリッドのマス目を作成してグリッド集合に登録
				const gridGeometry = new THREE.PlaneGeometry(this._blockSize, this._blockSize);
				const gridMaterial = new THREE.MeshBasicMaterial({

					color: 0xffffff,
					opacity: 0.1,
					side: THREE.DoubleSide,
					transparent: true
				});
				const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
				gridMesh.position.x =
					(i * this._blockSize) -
					(this._blockSize * Math.floor(this._blockStep / 2)) +
					(this._blockStep % 2 == 0 ? this._blockSize / 2 : 0);
				gridMesh.position.y = 1;
				gridMesh.position.z =
					(j * this._blockSize) -
					(this._blockSize * Math.floor(this._blockStep / 2)) +
					(this._blockStep % 2 == 0 ? this._blockSize / 2 : 0);
				gridMesh.rotation.x = -Math.PI / 2;
				this._gridGroup.add(gridMesh);

				// グリッド配列に保存
				this._gridList.push(gridMesh);
			}
		}

		// 選択中のマス目の位置を初期化
		this._selectMeshPos = new THREE.Vector3(0, 0, 0);

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
		const intersects = this._raycaster.intersectObjects(this._gridList);
		this._selectMesh = false;
		this._gridList.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object && !action) {

				// 2D 側イベントがない場合、対象をハイライト状態にする
				(<any>mesh.material).opacity = 0.3;

				// 対象の位置を記憶する
				this._selectMeshPos.x = mesh.position.x;
				this._selectMeshPos.y = this._gridGroup.position.y;
				this._selectMeshPos.z = mesh.position.z;
				this._selectMesh = true;

			} else {

				// その他は非ハイライト状態にする
				(<any>mesh.material).opacity = 0.1;
			}
		});
	}

	/**
	 * ハイライトの位置 X を文字列で取得
	 */
	public _getSelectPosX() {

		if (!this._selectMesh)
			return '-';
		else if (this._selectMeshPos.x % this._blockSize == 0)
			return String(this._selectMeshPos.x / this._blockSize) + '.0';
		else
			return String((this._selectMeshPos.x - this._blockSize / 2) / this._blockSize) + '.0';
	}

	/**
	 * ハイライトの位置 Z を文字列で取得
	 */
	public _getSelectPosZ() {

		if (!this._selectMesh)
			return '-';
		else if (this._selectMeshPos.z % this._blockSize == 0)
			return String(this._selectMeshPos.z / this._blockSize) + '.0';
		else
			return String((this._selectMeshPos.z - this._blockSize / 2) / this._blockSize) + '.0';
	}
}
