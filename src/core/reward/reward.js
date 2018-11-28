const { Map, Set, List, fromJS } = require('immutable')

const NodeType = require('reward-core/NodeType')
const { distributeReward } = require('reward-core')
const { createAdjacencyMatrix, isSet } = require('reward-core/utils')

const Address = require('../../models/address')
const Support = require('../../models/support')
const Reward = require('../../models/reward')

function isValidType(type) {
  return type === 'Generator' || type === 'Author' || type === 'Supporter'
}

function convertType(type) {
  if (type === 'Generator') return NodeType.GENERATOR
  if (type === 'Author') return NodeType.AUTHOR
  if (type === 'Supporter') return NodeType.SUPPORTER
}

/**
 * createGetNodeFeeFunc 
 */
function createGetNodeFeeFunc(edges, supporterFee, authorFee) {
  const matrix = createAdjacencyMatrix(edges)
  return (nodeId, parentId) => (isSet(matrix, parentId, nodeId) ? authorFee : supporterFee)
}

/**
 * calcRewardTotal
 * @param {*} rewardPerParent { '4': 0.9, '4_241': 0.225, '4_470': 0.225 }
 *  
 * @param {*} nodeToAddress 
 */
async function calcRewardTotal(rewardPerParent, nodeToAddress)
{
  const keys = Object.keys(rewardPerParent);
  for (let i=0; i<keys.length; i++) {
    const key = keys[i]
    const value = rewardPerParent[key]

    const nodes = key.split('_')
    
    const address = nodeToAddress[parseInt(nodes[0])]
    const linkAddress = nodes.length > 1 ? nodeToAddress[parseInt(nodes[1])] : null
    
    await Reward.findOneAndUpdate({address, linkAddress}, {$inc: {rewardTotal: value}}, {upsert: true})
  }
}

/**
 * processRewards
 * @param {*} rewardAmount 
 */
async function processRewards(rewardAmount) {
  // prepare nodes (addresses)
  const addresses = await Address.aggregate([
    {
      $project: { _id: 0, address: 1, type: 1 },
    },
  ])

  // create node map
  let nodeToAddress = []
  let addressToNode = []
  let nodes = []
  addresses.forEach(item => {
    if (isValidType(item.type)) {
      const id = nodes.length

      nodes.push({ id, type: convertType(item.type) })

      nodeToAddress.push(item.address)
      addressToNode[item.address] = id
    }
  })

  // prepare edges (support)
  const supports = await Support.aggregate([
    {
      $project: { _id: 0, addressFrom: 1, addressTo: 1 },
    },
  ])

  const edges = supports.map(support => ({
    source: addressToNode[support.addressFrom],
    target: addressToNode[support.addressTo],
  }))

  // update/validate node types according to edges

  // initialState
  const initialState = fromJS({ nodes, edges })

  // get all generators
  const generators = nodes.filter(item => item.type === NodeType.GENERATOR)

  // validate graph
  if (nodes.length === 0 || edges.length === 0 || generators.length === 0) {
    return { rewards: [], generator: null }
  }

  // select generator
  const selectedGenerator = generators[Math.floor(Math.random() * generators.length)]

  const block = Map({ finderId: selectedGenerator.id, subsidy: rewardAmount })

  // nodeFee
  const getNodeFee = createGetNodeFeeFunc(initialState.get('edges'), 0.1, 0.5)

  // do reward distribution
  const state = distributeReward({ state: initialState, block, getNodeFee })

  const rewardPerParent = state.get('rewardPerParent').toJS()
  calcRewardTotal(rewardPerParent, nodeToAddress)

  // prepare output
  const rewardsAll = state.toJS().nodes.map(item => ({
    address: nodeToAddress[item.id],
    reward: item.reward,
  }))

  // remove undefined rewards
  const rewards = rewardsAll.filter(item=>typeof item.reward !== 'undefined')

  return { rewards, generator: nodeToAddress[selectedGenerator.id] }
}

module.exports = { processRewards, createGetNodeFeeFunc }
