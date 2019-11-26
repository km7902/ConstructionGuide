import * as THREE from 'three';

/**
 * グリッドクラス
 */
export default class Grid {

	/* ブロックのサイズと数 */
	private _blockSize: number;
	private _blockStep: number;

	/* グリッド集合オブジェクト */
	private readonly _gridGroup: THREE.Group;

	/* グリッド制御オブジェクト */
	private _gridControl: THREE.Mesh[];

	/* グリッド選択オブジェクト */
	private _pickGridControl: THREE.Mesh;

	/* 公開: クリックの処理で必要 */
	public _getPickGridControl() {

		return this._pickGridControl;
	}

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene: 3D シーンオブジェクト
	 * @param {number} blockSize: ブロックのサイズ
	 * @param {number} blockStep: ブロックの数
	 */
	constructor(scene: THREE.Scene, blockSize: number, blockStep: number) {

		this._blockSize = blockSize; // ブロックのサイズ
		this._blockStep = blockStep; // ブロックの数

		// グリッドを作成
		const gridHelper = new THREE.GridHelper(

			this._blockSize * this._blockStep,
			this._blockStep,
			0xffff66,
			0xffffff
		);
		gridHelper.position.set(0, 1, 0);
		scene.add(gridHelper);

		// グリッド集合を作成する
		this._gridGroup = new THREE.Group();
		scene.add(this._gridGroup);

		// マウスカーソルとの交差を調べたいものはグリッド制御に格納する
		this._gridControl = [];

		// グリッドに合うように非選択メッシュを作成する
		let gridGeometry = new THREE.PlaneBufferGeometry(

			this._blockSize * this._blockStep,
			this._blockSize * this._blockStep
		);
		let gridMaterial = new THREE.MeshBasicMaterial({

			color: 0xffffff,
			opacity: 0,
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false
		});
		let gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
		gridMesh.position.set(0, 1, 0);
		gridMesh.rotation.x = -Math.PI / 2;
		this._gridGroup.add(gridMesh);

		// グリッド制御に追加
		this._gridControl.push(gridMesh);

		// 選択メッシュを作成する
		gridGeometry = new THREE.PlaneBufferGeometry(

			this._blockSize,
			this._blockSize
		);
		gridMaterial = new THREE.MeshBasicMaterial({

			color: 0xffffff,
			opacity: 0,
			side: THREE.DoubleSide,
			transparent: true
		});
		gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
		gridMesh.position.set(0, 2, 0);
		gridMesh.rotation.x = -Math.PI / 2;
		this._gridGroup.add(gridMesh);

		// グリッド選択に追加
		this._pickGridControl = gridMesh;

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
		const intersects = this._raycaster.intersectObjects(this._gridControl);
		this._gridControl.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object && !action) {

				// グリッド選択を表示
				(<any>this._pickGridControl.material).opacity = 0.5;
				this._pickGridControl.position.x =
					(Math.floor(intersects[0].point.x * 0.01) *
					 this._blockSize + (this._blockSize / 2));
				this._pickGridControl.position.z =
					(Math.floor(intersects[0].point.z * 0.01) *
					 this._blockSize + (this._blockSize / 2));

			} else {

				// グリッド選択を非表示
				(<any>this._pickGridControl.material).opacity = 0;
			}
		});
	}

	/**
	 * ハイライトのブロック座標 X を文字列で取得
	 */
	public _getPickGridX() {

		if ((<any>this._pickGridControl.material).opacity == 0)
			return '-';
		else if (this._pickGridControl.position.x % this._blockSize == 0)
			return String(this._pickGridControl.position.x / this._blockSize) + '.0';
		else
			return String((this._pickGridControl.position.x - this._blockSize / 2) / this._blockSize) + '.0';
	}

	/**
	 * ハイライトのブロック座標 Z を文字列で取得
	 */
	public _getPickGridZ() {

		if ((<any>this._pickGridControl.material).opacity == 0)
			return '-';
		else if (this._pickGridControl.position.z % this._blockSize == 0)
			return String(this._pickGridControl.position.z / this._blockSize) + '.0';
		else
			return String((this._pickGridControl.position.z - this._blockSize / 2) / this._blockSize) + '.0';
	}
}
