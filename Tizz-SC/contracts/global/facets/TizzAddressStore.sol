// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Initializable} from "../../external/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../../interfaces/interface-libs/IAddressStoreUtils.sol";

import "../../libraries/AddressStoreUtils.sol";

/**
 * @custom:version 7
 * @custom:oz-upgrades-unsafe-allow external-library-linking
 */
abstract contract TizzAddressStore is Initializable, IAddressStoreUtils {
    AddressStore internal addressStore;

    function initialize(
        address _rolesManager,
        address _tizz
    ) external initializer {
        uint256 addressStoreSlot;

        assembly {
            addressStoreSlot := addressStore.slot
        }
        if (addressStoreSlot != AddressStoreUtils.getSlot()) {
            revert WrongSlot();
        }

        if (_rolesManager == address(0) || _tizz == address(0)) {
            revert InitError();
        }

        _setRole(_rolesManager, Role.ROLES_MANAGER, true);

        IAddressStoreUtils.Addresses storage addresses = _getAddresses();
        addresses.tizz = _tizz;

        emit AddressesUpdated(addresses);
    }

    // Addresses
    function getAddresses() external view returns (Addresses memory) {
        return addressStore.globalAddresses;
    }

    function _getAddresses() internal view returns (Addresses storage) {
        return addressStore.globalAddresses;
    }

    // Roles
    function hasRole(address _account, Role _role) public view returns (bool) {
        return addressStore.accessControl[_account][_role];
    }

    function _setRole(address _account, Role _role, bool _value) internal {
        addressStore.accessControl[_account][_role] = _value;
        emit AccessControlUpdated(_account, _role, _value);
    }

    function setRoles(
        address[] calldata _accounts,
        Role[] calldata _roles,
        bool[] calldata _values
    ) external onlyRole(Role.ROLES_MANAGER) {
        uint256 length = _accounts.length;
        if (
            length == 0 || length != _roles.length || length != _values.length
        ) {
            revert InvalidInputLength();
        }

        for (uint256 i = 0; i < length; ++i) {
            if (_roles[i] == Role.ROLES_MANAGER && _accounts[i] == msg.sender) {
                revert NotAllowed();
            }

            _setRole(_accounts[i], _roles[i], _values[i]);
        }
    }

    function _enforceRole(Role _role) internal view {
        if (!hasRole(msg.sender, _role)) {
            revert WrongAccess();
        }
    }

    modifier onlyRole(Role _role) {
        _enforceRole(_role);
        _;
    }
}
